"use strict";

var gl;
var points;
window.onload = function init(){
	var canvas = document.getElementById( "test" );
	gl = WebGLUtils.setupWebGL( canvas );
	//获取画布元素
	// var canvas=document.getElementById("test");
	// //获取到元素的上下文环境对象
    // var gl=canvas.getContext('webgl');
	if( !gl ){
		alert( "WebGL isn't available" );
	}
	//顶点坐标值
	var vertices = new Float32Array([
	    //  x, y
	        0.0, 0.5, 
	        -0.5, -0.5,
	        0.5, -0.5, 
	]) ;
	//颜色坐标值
	var colors = new Float32Array([
		//  red, green, blue
		1.0, 0.0, 0.0,1.0,
		0.0, 1.0, 0.0,1.0,
		0.0, 0.0, 1.0 ,1.0,
	]);
	// Configure WebGL
	gl.viewport( 0, 0, canvas.width, canvas.height ); //设置视口大小
	gl.clearColor( 1.0,1.0, 1.0, 1.0 );//设置背景颜色
	
	// Load shaders and initialize attribute buffers
	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram(program);
	// Load the data into the GPU 创建一个缓存对象
	var bufferId = gl.createBuffer();
	//说明缓存对象保存的类型
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
	//写入坐标数据
	gl.bufferData( gl.ARRAY_BUFFER,vertices, gl.STATIC_DRAW );
	// Associate external shader variables with data buffer
	//获取到顶点着色器中的变量
	var vPosition = gl.getAttribLocation( program, "vPosition" );
	//将坐标值赋给变量
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false,0, 0 );
	//开启变量值的使用
	gl.enableVertexAttribArray( vPosition );
	//获取到数组中单个元素的字节数
	// var FSIZE = vertices.BYTES_PER_ELEMENT;
	var bufferId2 = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId2);
	gl.bufferData( gl.ARRAY_BUFFER,new Float32Array( colors ), gl.STATIC_DRAW );
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	render();
}
function render(){
	gl.clear( gl.COLOR_BUFFER_BIT );
	//gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
	gl.drawArrays( gl.TRIANGLES, 0, 3 );
	//gl.drawArrays( gl.TRIANGLE_FANS, 3, 6 );
}