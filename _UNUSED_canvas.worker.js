/*
	Worker for OffscreenCanvas
*/

let ctx,
background = true,	// background or foreground
fullscreen = true	// fullscreen or border only

onmessage = function(e) {
	// most used on top
	if (e.data.o) {
		const o = e.data.o
		let lines = lerp(1, 200, o.rec / o.len)
		//if (enc === 'br') lines = (deg === 90) ? ctx.canvas.clientWidth : ctx.canvas.clientHeight
		//if (enc === 'gzip') lines = (deg === 90) ? ctx.canvas.clientWidth/4 : ctx.canvas.clientHeight/4
		if (o.enc === 'br') lines = ctx.canvas.height/2 //lines = ctx.canvas.clientHeight/2
		if (o.enc === 'gzip') lines = ctx.canvas.height/3 //lines = ctx.canvas.clientHeight/3
		const data = o.chunk
		if (lines > data.length/3) lines = data.length/3
		const width = ctx.canvas.width
		console.log(lines)
		for (let y = 0, i = 0; y < lines; y++) {
			const style = "rgb("+ data[i++] +", "+ data[i++] +", "+ data[i++] +")"
			ctx.strokeStyle = style
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(width, y)
			ctx.stroke()
		}
	
		// punch hole
		if (!fullscreen) {
			ctx.clearRect(lines*0.05, lines*0.05, lines*0.90, lines*0.90)
		}
		return
	}

	// 1st init = transfer of offscreen canvas
	if (e.data.canvas) {
		background = e.data.background
		fullscreen = e.data.fullscreen
		//ctx = e.data.canvas.getContext('2d', {alpha: (!background)})
		ctx = e.data.canvas.getContext('2d', {alpha: true})	// dont want to switch
		return
	}

	// still here ?
	console.error('Unknown message:', e.data)
}
function lerp(a, b, n) {
	return (1-n)*a + n*b
}