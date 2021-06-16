var mzcanv = function (c) {
	this.canvas = c;
	
	this.buttonPaint = function (x,y, w,h ,text, style) {
		if (this.canvas.lineWidth!= style[0]) {
			this.canvas.lineWidth = style[0];		
		}
		if (this.canvas.strokeStyle != style[1]) {
			this.canvas.strokeStyle = style[1];		
		}
		if (this.canvas.fillStyle != style[2]) {
			this.canvas.fillStyle = style[2];		
		}
		
		this.canvas.beginPath();
		this.canvas.moveTo(x, y);
		this.canvas.lineTo(x+w, y);
		this.canvas.lineTo(x+w, y+h);
		this.canvas.lineTo(x, y+h);
		this.canvas.closePath();
		this.canvas.stroke();
		this.canvas.fill();
		
		var font = style[3] +'px '+ style[4];
		if (this.canvas.font != font) {
			c.font = font;
		}
		
		if (c.fillStyle == style[5]) {
			c.fillStyle = style[5];
		}
		
		c.fillText(text, x+fontsize, y+fontsize);
	}
	
	this.circlePaint = function (x1,y1,rad){
		this.canvas.beginPath(); 
		this.canvas.arc(x1,y1,rad,0,6.3,true);
		this.canvas.closePath(); 
	}
	
	this.vtxPaint = function (x, y, ch, styles, rad){
		this.canvas.lineWidth = .4;
		this.canvas.strokeStyle = styles[0];
		this.canvas.fillStyle = styles[1];
		this.canvasircle(c, x,y,10);
		this.canvas.fill();
		this.canvas.stroke();

		if (typeof(this.canvas.fillText) != 'undefined')
		{
			fontsize =  Math.floor(rad*1.4);
			this.canvas.font = fontsize+"px Fixedsys";
			this.canvas.fillStyle = styles[2];
			this.canvas.fillText(ch, x-fontsize/4, y+fontsize/4);
		}
	}

	this.lxPaint = function (x, y, x2, y2, styles) {
		this.canvas.lineWidth = styles[0];
		this.canvas.strokeStyle = styles[1];

		this.canvas.beginPath(); 
		this.canvas.moveTo(x, y);
		this.canvas.lineTo(x2, y2);
		this.canvas.closePath();
		this.canvas.stroke();

	}
	
	
	return this;
}

	function paint_btn(c,x,y, w,h ,text, styles){
		c.lineWidth = styles[0];
		c.strokeStyle = styles[1];
		c.fillStyle = styles[2];

		c.beginPath(); 
		c.moveTo(x, y);
		c.lineTo(x+w, y);
		c.lineTo(x+w, y+h);
		c.lineTo(x, y+h);
		c.closePath();
		c.stroke();
		c.fill();

		c.stroke();

		c.font = styles[3] +'px '+ styles[4];
		c.fillStyle = styles[5];
//		c.textAlign = 'center';
//		c.textBaseline = 'middle';

		c.fillText(text, x+fontsize, y+fontsize );
	}

	function circle(c,x1,y1,rad){
		c.beginPath(); 
		c.arc(x1,y1,rad,0,6.3,true);
		c.closePath(); 
	}

	function paint_vx(c, x, y, ch, styles, rad){
		c.lineWidth = .4;
		c.strokeStyle = styles[0];
		c.fillStyle = styles[1];
		circle(c, x,y,10);
		c.fill();
		c.stroke();

		if (typeof(c.fillText)!= 'undefined')
		{
			fontsize =  Math.floor(2*rad*.7);
			c.font = fontsize+"px Fixedsys";
//			c.textAlign = 'start';
//			c.textBaseline = 'alphabetic';
			c.fillStyle = styles[2];
			c.fillText(ch, x-fontsize/4, y+fontsize/4);
		}
	}

	function paint_lx(c, x, y, x2, y2, styles) {
			c.lineWidth = styles[0];
			c.strokeStyle = styles[1];

			c.beginPath(); 
			c.moveTo(x, y);
			c.lineTo(x2, y2);
			c.closePath();
			c.stroke();

	}