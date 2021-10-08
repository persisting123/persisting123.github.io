"use strict";
var canvas;
var gl;
var numTimesToSubdivide;
var num = window.prompt("请输入剖分层次：",0);
if(num>=0&&num<=7){
	numTimesToSubdivide = num;
}
else{
	alert("数据不合法，请刷新网页，重新输入！");
} 
window.onload = function initTriangles(){
	canvas = document.getElementById( "gl-canvas" )
	gl=canvas.getContext('2d');;
	// if( !gl ){
	// 	alert( "WebGL isn't available" );
	// }
	gl.strokeStyle="red";
	gl.lineWidth=1;
	sierpinski(300, 500-500*Math.sqrt(3)/2, 50, 500, 550, 500,numTimesToSubdivide);
	
};
function sierpinski(x1,y1,x2,y2,x3,y3,n){
	if(n<0) return;
	gl.beginPath();
	gl.moveTo(x1,y1);
	gl.lineTo(x2,y2);
	gl.lineTo(x3,y3);
	gl.lineTo(x1,y1);
	gl.closePath();
	gl.stroke();
	var x4 = (x1 + x2) / 2;
	var y4 = (y1 + y2) / 2;
	var x5 = (x2 + x3) / 2;
	var y5 = (y2 + y3) / 2;
	var x6 = (x1 + x3) / 2;
	var y6 = (y1 + y3) / 2;
	sierpinski(x1,y1,x4,y4,x6,y6,n-1);
	sierpinski(x6,y6,x5,y5,x3,y3,n-1);
	sierpinski(x4,y4,x2,y2,x5,y5,n-1);
	sierpinski(x4,y4,x5,y5,x6,y6,n-1);
}


