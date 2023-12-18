/*	LoaDeR DrSnuggles
	Amiga style copperbars showing loading progress
	It's not just random colors
	I have quick and small without any analysing stuff
	OR informative. % loaded OR packed gzip/br
*/

import * as UZIP from './uzip-greggman-unpack.js'
import {LDR as L} from './ldr.js'

export const LDR = {
	background: L.background,
	fullscreen: L.fullscreen,
	abort: L.abort,
	loadURL: async (url, cb) => {
		L.loadURL(url, (o) => {
			if (cb && !o.dat) cb (o)
			if (o.dat) unpack(o, cb)
		})
	}
}

function unpack (o, cb) {
	// now the depacker via dynamic import ?? not sure if i like that, would be nicer to have a all in one solution
	if (o.dat[0] === 80 && o.dat[1] === 75) {
		// PK, try to unzip
		try {
			o.dat = uzip.parse( Array.from(o.dat) )	// this blocks !!
		}catch(e){
			console.error(e)
		}
		//if (cb) cb(o)
		/*
		import('./uzip-greggman-unpack.js')
		.then(m => {
			o.dat = uzip.parse(chunksAll)
			exit(o,cb)
		})
		.catch(e=>{
			// uzip couldn't depack
			console.error(e)
			exit(o,cb)
		})
		*/
	} else {
		// not packed
		//if (cb) cb(o)
	}
	if (cb) cb(o)

}