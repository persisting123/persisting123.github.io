"use strict";

var canvas;
var gl;

var theta = 0.0;
var thetaLoc;
var k=1;//方向系数
var ss=0.1;
function inturn(){
	k*=-1;	
}

function inspeed(){
	ss=document.getElementById("speedd").value*Math.PI/4;
}

function initRotSquare(){
	canvas = document.getElementById( "rot-canvas" );
	gl = WebGLUtils.setupWebGL( canvas, "experimental-webgl" );
	if( !gl ){
		alert( "WebGL isn't available" );
	}

	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	var program = initShaders( gl, "rot-v-shader", "rot-f-shader" );
	gl.useProgram( program );

	var vertices = [
		 0,  1,  0,
		-1,  0,  0,
		 1,  0,  0,
		 0, -1,  0
	];
	//发送数据到GPU
	var bufferId = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );
	//获取顶点着色器中uniform变量的地址（建立顶点着色器中的属性变量与应用程序中相应变量的关联。
	thetaLoc = gl.getUniformLocation( program, "theta" );

	renderSquare();
}

function renderSquare(){
	gl.clear( gl.COLOR_BUFFER_BIT );
	
	// set uniform values
	theta += ss*k;
	if( theta > 2 * Math.PI )
		theta -= (2 * Math.PI);
	else if( theta < -2 * Math.PI ) theta += (2 * Math.PI);
	//将应用程序中theta的值发送到着色器中，1f表示传递的数据是一个
	gl.uniform1f( thetaLoc, theta );

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

	// update and render
	window.requestAnimFrame( renderSquare );
}