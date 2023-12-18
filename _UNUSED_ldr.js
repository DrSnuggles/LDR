/*	LoaDeR DrSnuggles
	Amiga style copperbars showing loading progress
	It's not just random colors
	I have quick and small without any analysing stuff
	OR informative. % loaded OR packed gzip/br
*/

//import * as UZIP from './uzip-greggman-unpack.js'
import {Loader} from './loader.js'

const fetchReaders = []
let canvasWorker

export const LDR = {
	background: true,	// background or foreground
	fullscreen: true,	// fullscreen or border only
	abort: (reader) => {stopCopperbars(reader)},
	loadURL: async (url, cb) => {
		initCanvas()
		const thisReader = new Loader(url, (o) => {
			canvasWorker.postMessage({o:{chunk:o.chunk, enc:o.enc, rec: o.rec, len: o.len, prot: o.prot}})
			if (cb) cb(o)
			if (o.dat) stopCopperbars(thisReader)
		})
		fetchReaders.push( thisReader )
	},
}
function initCanvas() {
	if (document.getElementById('copperbars')) return

	const canvas = document.createElement('canvas')
	canvas.id = 'copperbars'
	const zIndex = LDR.background ? -604 : 604
	canvas.style = 'position:absolute;top:'+scrollY+'px;left:0;width:100%;height:100%;image-rendering:pixelated;z-index:'+ zIndex +';'
	onscroll = (ev) => { canvas.style.top = scrollY +'px' }
	if (!document.getElementById('copperbars')) document.body.appendChild(canvas)// document.body.insertBefore(canvas, document.body.firstChild)

	canvasWorker = new Worker(new URL('./canvas.worker.js', import.meta.url), {type: 'module'}) // import.meta.url: https://stackoverflow.com/questions/12417216/javascript-not-resolving-worker-path-relative-to-current-script
	canvas.width = screen.width
	canvas.height = screen.height
	const offscreen = canvas.transferControlToOffscreen()
	canvasWorker.postMessage({	 // its nicer to pack the transfered objects into a new one
		canvas: offscreen,
		devicePixelRatio: devicePixelRatio,
		fullscreen: LDR.fullscreen,
		background: LDR.background,
	}, [offscreen])

}
function stopCopperbars(reader) {
	if (reader) {
		reader.abort()
		const actReaderIndx = fetchReaders.indexOf(reader)
		fetchReaders.splice(actReaderIndx, 1)
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