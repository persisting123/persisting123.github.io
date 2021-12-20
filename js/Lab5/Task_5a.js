"use strict";

const{ vec3, vec4, mat3, mat4, quat } = glMatrix;

var canvas;
var gl;
var fileInput;

var meshdata;
var mesh;

var points = [];
var colors = [];
var acolor = [];
var lineIndex = [];

var color;

var modelViewMatrix = mat4.create();//模-视变换矩阵，决定照相机的方向和位置
var projectionMatrix = mat4.create();//投影变换矩阵

var vBuffer = null;
var vPosition = null;
var cBuffer = null;
var vColor = null;
var iBuffer = null;

var lineCnt = 0;
//正投影
var oleft = -3.0;//视见体左侧面
var oright = 3.0;//视见体右侧面
var oytop = 3.0;//视见体顶部
var oybottom = -3.0;//视见体底部
var onear = -5;//近裁剪平面相距原点的距离
var ofar = 10;//远裁剪平面相距原点的距离

var oradius = 3.0;
var theta = 0.0;
var phi = 0.0;

var pleft = -10.0;
var pright = 10.0;
var pytop = 10.0;
var pybottom = -10.0;
var pnear = 0.01;
var pfar = 20;
var pradius = 3.0;

var fovy = 45.0 * Math.PI/180.0;
var aspect;

/* 物体位置 dx, dy, dz: the position of object */
var dx = 0;
var dy = 0;
var dz = 0;
var step = 0.1;
// 旋转
var dxt = 0;
var dyt = 0;
var dzt = 0;
var stept = 2;
// scale
var sx = 1;
var sy = 1;
var sz = 1;

/*相机位置 cx, cy, cz: the position of camera */
var cx = 0.0;
var cy = 0.0;
var cz = 4.0;
var stepc = 0.1;
//旋转
var cxt = 0;
var cyt = 0;
var czt = 0;
var stepct = 2;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
//定位照相机
var eye = vec3.fromValues(cx, cy, cz);//视点（对象标架下，照相机所在位置）
var at = vec3.fromValues(0.0, 0.0, 0.0);//参考点（照相机的方向所指位置）
var up = vec3.fromValues(0.0, 1.0, 0.0);//照相机的观察正向向量

var rquat = quat.create();

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var currentKey = [];

/* variables for interface control */
//投影方式
var projectionType = 1; // default is Orthographic(1), Perspective(2)
//绘制方式
var drawType = 1; // default is WireFrame(1), Solid(2)

var viewType = [0]; // default is orthographic frontview(1), leftView(2), topView(3), isoview(4)
var viewcnt = 0; // view count default = 0, in orthographic or perspective mode
//对象位置
var changePos = 1; // default is Object(1), camera(2)
//颜色
var currentColor = vec4.create();

var program = null;
window.onload = function initWindow(){
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    initInterface();

    checkInput();
}
//各事件处理
function initInterface(){
    fileInput = document.getElementById("fileInput");
	
    fileInput.addEventListener("change", function (event) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            meshdata = reader.result;
            initObj();
        }
        reader.readAsText(file);
    });

    var projradios = document.getElementsByName("projtype");
    for (var i = 0; i < projradios.length; i++) {
        projradios[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                projectionType = parseInt(value);
            }
            buildModelViewProj();
        });
    }

    var drawradios = document.getElementsByName("drawtype");
    for (var i = 0; i < drawradios.length; i++) {
        drawradios[i].onclick = function () {
            var value = this.value;
            if (this.checked) {
                drawType = parseInt(value);
            }
            updateModelData();
        }
    }

    document.getElementById("objcolor").addEventListener("input", function (event) {
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        currentColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) * 1.0 / 255.0,
            parseInt(rgbHex[1], 16) * 1.0 / 255.0,
            parseInt(rgbHex[2], 16) * 1.0 / 255.0,
            1.0
        );
        updateColor();
    });

	var postypeRadio = document.getElementsByName("posgrp");
	for (var i = 0; i < postypeRadio.length; i++) {
	    postypeRadio[i].addEventListener("click", function (event) {
	        var value = this.value;
	        if (this.checked) {
	            changePos = parseInt(value);
	            restoreSliderValue(changePos);//重置物体或相机的初始位置等变量
	        }
	    });
	}
	
    document.getElementById("xpos").addEventListener("input", function(event){
        if(changePos===1)//物体位置
            dx = this.value;
        else if(changePos===2)//相机位置
            cx = this.value;
        buildModelViewProj();
    });
    document.getElementById("ypos").addEventListener("input", function(event){
        if(changePos===1)
            dy = this.value;
        else if(changePos===2)
            cy = this.value;
        buildModelViewProj();
    });
    document.getElementById("zpos").addEventListener("input", function(event){
        if(changePos===1)
            dz = this.value;
        else if(changePos===2)
            cz = this.value;
        buildModelViewProj();
    });

    document.getElementById("xrot").addEventListener("input", function(event){
        if(changePos===1)
            dxt = this.value;
        else if(changePos===2)
            cxt = this.value;
        buildModelViewProj();
    });
    document.getElementById("yrot").addEventListener("input", function(event){
        if(changePos===1)
            dyt = this.value;
        else if(changePos===2)
            cyt = this.value;
        buildModelViewProj();
    });
    document.getElementById("zrot").addEventListener("input",function(event){
        if (changePos === 1)
            dzt = this.value;
        else if (changePos === 2)
            czt = this.value;
        buildModelViewProj();
    });
    document.onkeydown = handleKeyDown;//键盘按下事件
    document.onkeyup = handleKeyUp;//键盘松开事件
    canvas.onmousedown = handleMouseDown;//鼠标按下
    document.onmouseup = handleMouseUp;//鼠标松开 
    document.onmousemove = handleMouseMove;//鼠标移动
}
//得到模-视变换矩阵和投影变换矩阵
function buildModelViewProj(){
    /* ModelViewMatrix & ProjectionMatrix */
    //eye = vec3.fromValues(cx, cy, cz);
    var localRadius;

    if( projectionType == 1 ){//正交投影
	
        mat4.ortho( pMatrix, oleft, oright, oybottom, oytop, onear, ofar );
        localRadius = oradius;
    }else{ //透视投影
        aspect = 1;
        mat4.perspective(pMatrix, fovy, aspect, pnear, pfar);
        //mat4.frustum( pMatrix, pleft, pright, pybottom, pytop, pnear, pfar );
        localRadius = pradius;
    }
    
    var rthe = theta * Math.PI / 180.0;
    var rphi = phi * Math.PI / 180.0;
	//视点坐标
    vec3.set(eye, localRadius * Math.sin(rthe) * Math.cos(rphi), localRadius * Math.sin(rthe) * Math.sin(rphi), localRadius * Math.cos(rthe)); 

    mat4.lookAt( mvMatrix, eye, at, up );

    mat4.translate( mvMatrix, mvMatrix, vec3.fromValues( dx, dy, dz ) );
    
    mat4.rotateZ(mvMatrix, mvMatrix, dzt * Math.PI / 180.0);
    mat4.rotateY(mvMatrix, mvMatrix, dyt * Math.PI / 180.0);
    mat4.rotateX(mvMatrix, mvMatrix, dxt * Math.PI / 180.0);

    //mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(dx, dy, dz));
    mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(sx, sy, sz));

    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrix, false, new Float32Array(mvMatrix));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrix, false, new Float32Array(pMatrix));
}
//改变对象位置时，重置物体或相机的初始位置等变量
function restoreSliderValue(changePos){
    if (changePos === 1) {
        document.getElementById("xpos").value = dx;
        document.getElementById("ypos").value = dy;
        document.getElementById("zpos").value = dz;
        document.getElementById("xrot").value = Math.floor(dxt);
        document.getElementById("yrot").value = Math.floor(dyt);
        document.getElementById("zrot").value = Math.floor(dzt);
    }
    if (changePos === 2) {
        document.getElementById("xpos").value = cx;
        document.getElementById("ypos").value = cy;
        document.getElementById("zpos").value = cz;
        document.getElementById("xrot").value = Math.floor(cxt);
        document.getElementById("yrot").value = Math.floor(cyt);
        document.getElementById("zrot").value = Math.floor(czt);
    }
}
//修改绘制方式
function updateModelData(){
    if( vBuffer === null)
        vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer );
    lineIndex = [];
    for( var i = 0; i < mesh.indices.length; i+=3 ){
        lineIndex.push(mesh.indices[i], mesh.indices[i+1]);
        lineIndex.push(mesh.indices[i+1], mesh.indices[i + 2]);
        lineIndex.push(mesh.indices[i+2], mesh.indices[i]);
    }
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW );
}
//更新颜色
function updateColor(){
    var bcolor = [];
    for (var i = 0; i < mesh.vertexBuffer.numItems; i++)
        bcolor.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcolor), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor",);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

//使用键码
function handleKeyDown(event) {
    var key = event.keyCode;
    currentKey[key] = true;
    if( changePos === 1 ){
        switch (key) {
            case 65: //left//a
                dx -= step;
                document.getElementById("xpos").value=dx;
                break;
            case 68: // right//d
                dx += step;
                document.getElementById("xpos").value=dx;
                break;
            case 87: // up//w
                dy += step;
                document.getElementById("ypos").value=dy;
                break;
            case 83: // down//s
                dy -= step;
                document.getElementById("ypos").value=dy;
                break;
            case 90: // a//z
                dz += step;
                document.getElementById("zpos").value=dz;
                break;
            case 88: // d//x
                dz -= step;
                document.getElementById("zpos").value=dz;
                break;
            case 72: // h//ytheta-
                dyt -= stept;
                document.getElementById("yrot").value=dyt;
                break;
            case 75: // k//ytheta+
                dyt += stept;
                document.getElementById("yrot").value = dyt;
                break;
            case 85: // u//xtheta+
                dxt -= stept;
                document.getElementById("xrot").value = dxt;
                break;
            case 74: // j//xtheta-
                dxt += stept;
                document.getElementById("xrot").value = dxt;
                break;
            case 78: // n//ztheta+
                dzt += stept;
                document.getElementById("zrot").value = dzt;
                break;
            case 77: // m//ztheta-
                dzt -= stept;
                document.getElementById("zrot").value = dzt;
                break;
            case 82: // r//reset
                dx = 0;
                dy = 0;
                dz = 0;
                dxt = 0;
                dyt = 0;
                dzt = 0;
                break;
        }
    }
    if( changePos === 2 ){
        switch (key) {
            case 65: //left//a
                cx -= stepc;
                document.getElementById("xpos").value = cx;
                break;
            case 68: // right//d
                cx += stepc;
                document.getElementById("xpos").value = cx;
                break;
            case 87: // up//w
                cy += stepc;
                document.getElementById("ypos").value = cy;
                break;
            case 83: // down//s
                cy -= stepc;
                document.getElementById("ypos").value = cy;
                break;
            case 90: // a//z
                cz += stepc;
                document.getElementById("zpos").value = cz;
                break;
            case 88: // d//x
                cz -= stepc;
                document.getElementById("zpos").value = cz;
                break;
            case 72: // h//ytheta-
                cyt -= stepct;
                document.getElementById("yrot").value = cyt;
                break;
            case 75: // k//ytheta+
                cyt += stepct;
                document.getElementById("yrot").value = cyt;
                break;
            case 85: // u//xtheta+
                cxt -= stepct;
                document.getElementById("xrot").value = cxt;
                break;
            case 74: // j//xtheta-
                cxt += stepct;
                document.getElementById("xrot").value = cxt;
                break;
            case 78: // n//ztheta+
                czt += stepct;
                document.getElementById("zrot").value = czt;
                break;
            case 77: // m//ztheta-
                czt -= stepct;
                document.getElementById("zrot").value = czt;
                break;
            case 82: // r//reset
                cx = 0;
                cy = 0;
                cz = 4;
                cxt = 0;
                cyt = 0;
                czt = 0;
                break;
        }
    }
    buildModelViewProj();
}
//松开键盘按键
function handleKeyUp(event) {
    currentKey[event.keyCode] = false;
}
//鼠标按下事件，记录
function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
//鼠标松开事件
function handleMouseUp(event) {
    mouseDown = false;
}
//鼠标移动事件
function handleMouseMove(event) {
    if (!mouseDown)
        return;

    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = (newX - lastMouseX);
    var d = deltaX;
    theta = theta - parseFloat(d);
    
    var deltaY = (newY - lastMouseY);
    d = deltaY;
    phi = phi - parseFloat(d);

    lastMouseX = newX;
    lastMouseY = newY;
    buildModelViewProj();
}
//重新确认各个方式
function checkInput(){
	//投影方式
    var ptype = document.getElementById( "ortho" ).checked;
    if( ptype ) {
        projectionType = 1;
    }else{
        if( document.getElementById( "persp" ).checked )
            projectionType = 2;
    }
	//绘制方式
    var dtype = document.getElementById( "wire" ).checked;
    if( dtype ){
        drawType = 1;
    }else{
        if( document.getElementById( "solid" ).checked )
            drawType = 2;
    }
	//绘制颜色
    var hexcolor = document.getElementById( "objcolor" ).value.substring(1);
    var rgbHex = hexcolor.match(/.{1,2}/g);
    currentColor = vec4.fromValues( 
        parseInt(rgbHex[0], 16)/255.0,
        parseInt(rgbHex[1], 16)/255.0,
        parseInt(rgbHex[2], 16)/255.0,
        1.0
    );
}
//读入Obj文件数据
function initObj(){
    mesh = new OBJ.Mesh( meshdata );
    // mesh.normalBuffer, mesh.textureBuffer, mesh.vertexBuffer, mesh.indexBuffer
    OBJ.initMeshBuffers( gl, mesh );

    gl.bindBuffer( gl.ARRAY_BUFFER, mesh.vertexBuffer );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var bcolor = [];
    for( var i=0; i<mesh.vertexBuffer.numItems; i++)
        bcolor.push( currentColor[0], currentColor[1], currentColor[2], currentColor[3] );

    if( cBuffer === null) 
        cBuffer = gl.createBuffer();

    // setColors
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( bcolor ), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor",  );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    dx = -1.0 * (parseFloat(mesh.xmax) + parseFloat(mesh.xmin))/2.0;
    dy = -1.0 * (parseFloat(mesh.ymax) + parseFloat(mesh.ymin))/2.0;
    dz = -1.0 * (parseFloat(mesh.zmax) + parseFloat(mesh.zmin))/2.0;

    var maxScale;
    var scalex = Math.abs(parseFloat(mesh.xmax)-parseFloat(mesh.xmin));
    var scaley = Math.abs(parseFloat(mesh.ymax)-parseFloat(mesh.ymin));
    var scalez = Math.abs(parseFloat(mesh.zmax)-parseFloat(mesh.zmin));

    maxScale = Math.max(scalex, scaley, scalez);

    sx = 2.0/maxScale;
    sy = 2.0/maxScale;
    sz = 2.0/maxScale;

    dx = 0;
    dy = 0;
    dz = 0;
    updateModelData();
    buildModelViewProj();
    updateColor();
    render();
}
//渲染绘制
function render(){
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderType( drawType );
}
function renderType(type){
    if (type == 1) {//线框模式
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer);
        gl.drawElements(gl.LINES, lineIndex.length, gl.UNSIGNED_SHORT, 0);
    } else {//实体模式
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
// ???
var interval = setInterval(timerFunc, 30);
function timerFunc() {
    render();
}
//？？？
function buildMultiViewProj(type){
    if( type[0] === 0 )
        render();
    else
        rendermultiview();
}
//？？？
function initBuffers(){
    vBuffer = gl.createBuffer();
    cBuffer = gl.createBuffer();
}