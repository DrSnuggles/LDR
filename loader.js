/*	LoaDeR DrSnuggles
	Returns information about loading
	chunks of data or all data
*/

export class Loader {
	constructor(url, cb) {
		this.load(url, cb)
	}

	//abort () { this.reader.cancel() }

	async load(url, cb) {
		let response
		try {
			response = await fetch(url)
		} catch(e) {
			//console.log('shit')
			//console.error(e)
			if (cb) cb(false)
			return	// stop here!
		}

		this.reader = response.body.getReader()
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
			const {done, value} = await this.reader.read()
			if (done) break
			chunks.push(value)
			//if (o.rec == 0) console.log(value.length)
		
			o.rec += value.length
			o.chunk = value
			//renderCopperbars(value, o.rec, o.len, o.enc, o.prot) // use new one to reach 100% (at least for unencoded content)
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

		// ?? needed this.abort()
		if (cb) cb(o)

	}
}

function timestamp() {
	//return new Date().getTime()						// ms
	return performance.timeOrigin + performance.now()	// ms with fractions
}