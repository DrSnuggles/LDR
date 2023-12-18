/*	LoaDeR DrSnuggles
	Amiga style copperbars showing loading progress
	It's not just random colors
	I have quick and small without any analysing stuff
	OR informative. % loaded OR packed gzip/br
*/

//import * as UZIP from './uzip-greggman-unpack.js'

const fetchReaders = []
let ctx

export const LDR = {
	background: true,	// background or foreground
	fullscreen: true,	// fullscreen or border only
	abort: (reader) => {stopCopperbars(reader)},
	loadURL: async (url, cb) => {
		startCopperbars()

		let response = await fetch(url)
		const thisReader = response.body.getReader()
		fetchReaders.push( thisReader )
		const contentType = response.headers.get('Content-Type')
		const contentLength = response.headers.get('Content-Length') // not trustworth for array init (could be compressed)
		const contentEncoding = response.headers.get('Content-Encoding')
		// https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/nextHopProtocol
		/*
		const resources = performance.getEntriesByType('resource')
		const prot = resources[resources.length-1].nextHopProtocol	// depends on HTTP Header Timing-Allow-Origin
		console.log(resources[resources.length-1].name)
		*/
		let chunks = []
		let o = {
			url: url,
			typ: contentType,
			len: contentLength*1,
			enc: contentEncoding,
			//prot: prot,		// was wrong   performance.getEntriesByType('navigation')[0].nextHopProtocol,			// only if nextHop is on main server ;)
			rec: 0,
			dat: false,
			start: timestamp(),
		}
		//console.log( JSON.stringify(o) )
		while(true) {
			const {done, value} = await thisReader.read()
			if (done) break
			chunks.push(value)
			//if (o.rec == 0) console.log(value.length)
			
			o.rec += value.length
			renderCopperbars(value, o.rec, o.len, o.enc, o.prot) // use new one to reach 100% (at least for unencoded content)

			if (cb) cb(o)
		}
		// necessary ?? would love to get rid of this... contentLength is not save for Uint8 init (packed content)
		let chunksAll = new Uint8Array(o.rec)
		let position = 0
		for(let chunk of chunks) {
			chunksAll.set(chunk, position)
			position += chunk.length
		}
		o.dat = chunksAll
		o.end = timestamp()
		o.dur = o.end - o.start
		o.bps = o.len*8 / o.dur	// len = transfered | rec = unpacked
		// exit(o,ob)
		stopCopperbars(thisReader)
		if (cb) cb(o)

		// now the depacker via dynamic import ?? not sure if i like that, would be nicer to have a all in one solution
		// if (chunksAll[0] === 80 && chunksAll[1] === 75) {
		// 	// PK, try to unzip
		// 	try {
		// 		o.dat = uzip.parse(chunksAll)
		// 	}catch(e){
		// 		console.error(e)
		// 	}
		// 	exit(o,cb)
		// 	/*
		// 	import('./uzip-greggman-unpack.js')
		// 	.then(m => {
		// 		o.dat = uzip.parse(chunksAll)
		// 		exit(o,cb)
		// 	})
		// 	.catch(e=>{
		// 		// uzip couldn't depack
		// 		console.error(e)
		// 		exit(o,cb)
		// 	})
		// 	*/
		// } else {
		// 	// not packed
		// 	exit(o,cb)
		// }
	},
}
/*
function exit(o, cb) {
	stopCopperbars()
	if (cb) cb(o)
}
*/
function startCopperbars() {
	//stopCopperbars()
	if (document.getElementById('copperbars')) return

	const canvas = document.createElement('canvas')
	canvas.id = 'copperbars'
	const zIndex = LDR.background ? -604 : 604
	canvas.style = 'position:absolute;top:0;left:0;width:100%;height:100%;image-rendering:pixelated;z-index:'+ zIndex +';'
	if (!document.getElementById('copperbars')) document.body.appendChild(canvas)
	ctx = canvas.getContext('2d',{alpha: (!LDR.background)})
}
function stopCopperbars(reader) {
	if (reader) {
		reader.cancel()
		const actReaderIndx = fetchReaders.indexOf(reader)
		fetchReaders.splice(actReaderIndx, 1)
	}
	if (fetchReaders.length === 0) {
		if (document.getElementById('copperbars')) document.body.removeChild( document.getElementById('copperbars') )
	}
}
function renderCopperbars(data, rec, len, enc, prot) {
	// https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/nextHopProtocol
	/*
	let deg = 135						// downwards = shouldn't see this http/1.0 http/0.9
	if (prot === 'h3') deg = 0			// horizontal = elite
	if (prot === 'h2' || prot === 'h2c') deg = 90			// vertical = modern
	if (prot === 'http/1.1') deg = 45	// upwards = not bottom
	//if (prot === 'http/1.0') deg = 135	// downwards = shouldn't see this
	*/
	
	let lines = lerp(1, 200, rec/len)
	//if (enc === 'br') lines = (deg === 90) ? ctx.canvas.clientWidth : ctx.canvas.clientHeight
	//if (enc === 'gzip') lines = (deg === 90) ? ctx.canvas.clientWidth/4 : ctx.canvas.clientHeight/4
	if (enc === 'br') lines = ctx.canvas.clientHeight/2
	if (enc === 'gzip') lines = ctx.canvas.clientHeight/3
	if (lines > data.length/3) lines = data.length/3
	ctx.canvas.width = lines
	ctx.canvas.height = lines

	//console.time('renderLoop')
	//if (deg === 0) {
		// horizontal h3
		for (let y = 0, i = 0; y < lines; y++) {
			const style = "rgb("+ data[i++] +", "+ data[i++] +", "+ data[i++] +")"
			ctx.strokeStyle = style
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(lines, y)
			ctx.stroke()
		}
	/*
	} else if (deg === 45) {
		// diagonal http1.1
		for (let y = 0, i = 0; y < lines*2; y++) {
			const style = "rgb("+ data[i++] +", "+ data[i++] +", "+ data[i++] +")"
			ctx.strokeStyle = style
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(y, 0)
			ctx.stroke()
		}
	} else if (deg === 90) {
		// vertical h2
		for (let x = 0, i = 0; x < lines; x++) {
			const style = "rgb("+ data[i++] +", "+ data[i++] +", "+ data[i++] +")"
			ctx.strokeStyle = style
			ctx.beginPath()
			ctx.moveTo(x, 0)
			ctx.lineTo(x, lines)
			ctx.stroke()
		}
	} else if (deg === 135) {
		// diagonal http1.0
		for (let y = lines*-1, i = 0; y < lines; y++) {
			const style = "rgb("+ data[i++] +", "+ data[i++] +", "+ data[i++] +")"
			ctx.strokeStyle = style
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(lines, lines+y)
			ctx.stroke()
		}
	}
	*/

	// punch hole
	if (!LDR.fullscreen) {
		ctx.clearRect(lines*0.05, lines*0.05, lines*0.90, lines*0.90)
	}

	//console.timeEnd('renderLoop')
}
function lerp(a, b, n) {
	return (1-n)*a + n*b
}
function timestamp() {
	//return new Date().getTime()						// ms
	return performance.timeOrigin + performance.now()	// ms with fractions (10000ths = 0.1 µ = 100n)
}