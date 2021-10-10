"use strict";
const { vec3 } = glMatrix;
var canvas;
var gl;
var points = [];
var numTimesToSubdivide;
var angle;
var num = window.prompt("请输入剖分层次：",0);
if(num>=0&&num<=7){
	numTimesToSubdivide = num;
}
else{
	alert("数据不合法，请刷新网页，重新输入！");
} 
var d = window.prompt("请输入旋转角度：",0);
if(d >= 0 && d <= 360){
	angle = d;
}
else{
	alert("数据不合法，请刷新网页，重新输入！");
} 


window.onload = function initTriangles(){
	canvas = document.getElementById( "gl-canvas" );

	gl = WebGLUtils.setupWebGL( canvas );
	if( !gl ){
		alert( "WebGL isn't available" );
	}

	// initialise data for Sierpinski gasket

	// first, initialise the corners of the gasket with three points.
	var vertices = [
		0, 0.5,  0,
		-0.433012701892,  -0.25,  0,
		0.433012701892,  -0.25,  0,
	];

	// var u = vec3.create();
	// vec3.set( u, -1, -1, 0 );
	var u = vec3.fromValues( vertices[0], vertices[1], vertices[2] );
	// var v = vec3.create();
	// vec3.set( v, 0, 1, 0 );
	var v = vec3.fromValues( vertices[3], vertices[4], vertices[5] );
	// var w = vec3.create();
	// vec3.set( w, 1, -1, 0 );
	var w = vec3.fromValues( vertices[6], vertices[7], vertices[8] );
	
	divideTriangle( u, v, w, numTimesToSubdivide );
	
	rotate(angle);
	
    // configure webgl
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	
	// load shaders and initialise attribute buffers
	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	// load data into gpu
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( points ), gl.STATIC_DRAW );

	// associate out shader variables with data buffer
	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );
	renderTriangles();
};
function triangle( a, b, c ){
	//var k;
	points.push( a[0], a[1], a[2], b[0], b[1], b[2]);
	points.push( b[0], b[1], b[2], c[0], c[1], c[2]);
	points.push( c[0], c[1], c[2], a[0], a[1], a[2]);
	// for( k = 0; k < 3; k++ )
	// 	points.push( a[k] );
	// for( k = 0; k < 3; k++ )
	// 	points.push( b[k] );
	// for( k = 0; k < 3; k++ )
	// 	points.push( c[k] );
}
function divideTriangle( a, b, c, count ){
	// check for end of recursion
	if( count == 0 ){
		triangle( a, b, c );
		return;
	}else{
		var ab = vec3.create();
		vec3.lerp( ab, a, b, 0.5 );
		var bc = vec3.create();
		vec3.lerp( bc, b, c, 0.5 );
		var ca = vec3.create();
		vec3.lerp( ca, c, a, 0.5 );

		--count;
		// three new triangles
		divideTriangle( a, ab, ca, count );
		divideTriangle( b, bc, ab, count );
		divideTriangle( c, ca, bc, count );
		divideTriangle( ab, ca, bc, count);
	}
}
function rotateTriangle(a,angle){
	var theta = angle * Math.PI / 180.0;
	theta=theta
	var x = a[0];
	var y = a[1];
	var z = a[2];
	var x1 = x * Math.cos(theta) + y * Math.sin(theta);
	var y1 = y * Math.cos(theta) - x * Math.sin(theta);
	return vec3.fromValues(x1, y1, z);
}
function getLength(a,b){
	var d = Math.sqrt(a * a + b * b);
	return d;
}
function rotate(angle){
	for(var i = 0;i < points.length;i += 3){
		var length=getLength(points[i], points[i+1]);
		var angle2=angle*length/0.5;
		var p = rotateTriangle(vec3.fromValues(points[i], points[i+1], points[i+2]), angle2);
		points[i] = p[0];
		points[i+1] = p[1];
	}
}
function renderTriangles(){
	gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( gl.LINES, 0, points.length/3);
}