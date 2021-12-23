var px = 400;
var py = 30;
var pz = 0;
var camera, scene, renderer, controls, mixer, requestId;
var velocity = new THREE.Vector3();
var birdmesh;
var objects = [];
var totalLen = 0; //所有障碍物的距离
var score = 0;
var flag = false;

function startup() {
	var div1 = document.getElementById("div1");
	div1.style.display = "none";
	var div2 = document.getElementById("div2");
	div2.style.display = "none";
	init();
	animate();
}

function again() {
	var div2 = document.getElementById("div2");
	div2.style.display = "none";
	var bird = document.getElementById("bird");
	bird.style.display = "block";
	animate();
}

function gameover() {
	var div2 = document.getElementById("div2");
	div2.style.display = "none";
	var div3 = document.getElementById("div3");
	div3.style.display = "block";
}

function init() {
	//添加div块，用作画布
	container = document.createElement('div');
	container.id = "bird";
	document.body.appendChild(container);
	//
	document.body.onkeydown = function(event) {
		var e = event.keyCode;
		// console.log(e);
		if (e == 87) { //w
			py += 10;
		} else if (e == 83) { //s
			py -= 10;
		} else if (e == 65) { //a
			px += 10;
		} else if (e == 68) { //d
			px -= 10;
		} else if (e == 90) { //z
			pz += 10;
		} else if (e == 88) { //x
			pz -= 10;
		}
		console.log(px + " " + py + " " + pz);
	};

	//渲染器初始化
	renderer = new THREE.WebGLRenderer({
		antialias: true //设置为抗锯齿
	});
	renderer.setPixelRatio(window.devicePixelRatio); //设置设备像素比。
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	//场景初始化
	scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight(0x443333, 0x222233)); //半球光
	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(1, 1, 1);
	scene.add(light);

	//相机初始化
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
	camera.up.set(0, 1, 0);
	camera.lookAt(new THREE.Vector3(0, 1, 0));
	camera.rotateY(Math.PI / 2);
	//添加地板
	AddFloor();
	//天空盒
	AddSkybox();
	//连续障碍物
	AddBarrier();
	//鸟
	AddBird();
}

function AddFloor() {
	var geometry = new THREE.PlaneGeometry(200, 100000);

	var texture = new THREE.TextureLoader().load('img/floor.jpg');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(5, 200)
	var material = new THREE.MeshBasicMaterial({
		map: texture
	});

	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(0, 0, 0);
	mesh.translateY(-22500);
	scene.add(mesh);
	// objects.push(mesh);
}

function AddSkybox() {
	var directions = ["px", "nx", "py", "ny", "pz", "nz"]; //获取对象
	var format = ".jpg"; //格式
	//创建盒子，并设置盒子的大小为
	var skyGeometry = new THREE.BoxGeometry(100000, 100000, 100000, 7, 7, 7);
	//设置盒子材质
	var materialArray = [];
	var ImageUtils = new THREE.TextureLoader();
	for (var i = 0; i < 6; i++)
		materialArray.push(new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture("img/" + directions[i] + format), //将图片纹理贴上
			side: THREE.BackSide /*镜像翻转，如果设置镜像翻转，那么只会看到黑漆漆的一片，因为你身处在盒子的内部，所以一定要设置镜像翻转。*/
		}));
	var skyMaterial = new THREE.MultiMaterial(materialArray);
	var skyBox = new THREE.Mesh(skyGeometry, skyMaterial); //创建一个完整的天空盒，填入几何模型和材质的参数
	skyBox.rotateX(Math.PI / 2);
	skyBox.translateY(-22500);
	scene.add(skyBox); //在场景中加入天空盒
}

function AddBarrier() {
	var ImageUtils = new THREE.TextureLoader();
	for (var i = 1; i <= 100; i++) {
		var ht = Math.random() * 500;
		var barrier = new THREE.CylinderGeometry(50, 50, ht, 40, 40);
		barrier.rotateX(Math.PI / 2);
		var p = parseInt(Math.random() * 10) + 1;
		// console.log(p);
		var material = new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture("img/barrier/" + p + ".jpg")
		});
		var mesh = new THREE.Mesh(barrier, material);

		var len = parseInt(Math.random() * 400 + 400);
		totalLen += len;

		mesh.position.x = 0;
		mesh.position.y = totalLen;
		mesh.position.z = ht / 2;
		scene.add(mesh);

		objects.push(mesh);

		barrier = new THREE.CylinderGeometry(50, 50, 500 - ht, 40, 40);
		barrier.rotateX(Math.PI / 2);
		mesh = new THREE.Mesh(barrier, material);
		mesh.position.x = 0;
		mesh.position.y = totalLen;
		mesh.position.z = ht + 150 + (450 - ht) / 2;
		scene.add(mesh);

		objects.push(mesh);
	}
}

function AddBird() {
	var loader = new THREE.JSONLoader();

	loader.load("src/flamingo.js", function(geometry) {
		geometry.computeMorphNormals();
		var material = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			morphTargets: true,
			morphNormals: true,
			vertexColors: THREE.FaceColors,
			shading: THREE.SmoothShading
		});
		birdmesh = new THREE.Mesh(geometry, material);
		birdmesh.position.x = 0;
		birdmesh.position.y = 0;
		birdmesh.position.z = 200;
		birdmesh.scale.set(0.2, 0.2, 0.2);
		birdmesh.rotateX(-Math.PI / 2);
		birdmesh.rotateZ(Math.PI);
		//放大；
		birdmesh.scale.x = 0.5;
		birdmesh.scale.y = 0.5;
		birdmesh.scale.z = 0.5;
		scene.add(birdmesh);
		mixer = new THREE.AnimationMixer(birdmesh);
		//
		var clip = THREE.AnimationClip.CreateFromMorphTargetSequence('bird', geometry.morphTargets, 30);
		mixer.clipAction(clip).setDuration(1).play();

		window.addEventListener('mousedown', function(event) {
			velocity.z = 500;
			mixer.clipAction(clip).setDuration(0.2).play();
		}, false);

		window.addEventListener('mouseup', function(event) {
			mixer.clipAction(clip).setDuration(1).play();
		}, false);
	});
}
//
function animate() {
	requestId = requestAnimationFrame(animate);
	render();
}
//
function stop() {
	window.cancelAnimationFrame(requestId);
	requestId = undefined;
}
//
function render() {
	//这里100就是速度的一个因子，数值越大，重力效果越明显
	velocity.z -= 9.8 * 100 * 0.017;

	birdmesh.position.z += velocity.z * 0.017;
	birdmesh.position.y += velocity.y * 0.017;

	// console.log(birdmesh.position.y);
	if (birdmesh.position.y > (totalLen + 250)) {
		stop();
		var bird = document.getElementById("bird");
		bird.style.display = "none";
		var div4 = document.getElementById("div4");
		div4.style.display = "block";
		var sco = document.getElementById("score").innerHTML = score;
		birdmesh.position.y = 0;
		score = 0;
	}
	// score = 10;
	var rank = parseInt(score / 20);
	velocity.y = 200 + rank * 50;
	px = 400 + rank * 100;

	var raycaster1 = new THREE.Raycaster(birdmesh.position, new THREE.Vector3(0, 1, 0), 0, 45);
	var raycaster2 = new THREE.Raycaster(birdmesh.position, new THREE.Vector3(0, 0, 1), 0, 10);
	var raycaster3 = new THREE.Raycaster(birdmesh.position, new THREE.Vector3(0, 0, -1), 0, 10);
	var raycaster4 = new THREE.Raycaster(birdmesh.position, new THREE.Vector3(0, 0, 1), 0, 150);
	var raycaster5 = new THREE.Raycaster(birdmesh.position, new THREE.Vector3(0, 0, -1), 0, 150);
	//
	var intersections1 = raycaster1.intersectObjects(objects);
	var intersections2 = raycaster2.intersectObjects(objects);
	var intersections3 = raycaster3.intersectObjects(objects);
	var intersections4 = raycaster4.intersectObjects(objects);
	var intersections5 = raycaster5.intersectObjects(objects);
	//是否检测到
	if (intersections1.length > 0) {
		stop();
		var bird = document.getElementById("bird");
		bird.style.display = "none";
		var div2 = document.getElementById("div2");
		div2.style.display = "block";
		console.log("opps:"+score);
		var sco = document.getElementById("score").innerHTML = score;
		birdmesh.position.y = 0;
		score = 0;
	}
	if (intersections2.length > 0) { //上方检测到障碍物
		if (velocity.z > 0) {
			velocity.z = 0;
		}
	}
	if (intersections3.length > 0) { //下方检测到障碍物
		if (velocity.z < 0) {
			velocity.z = 0;
		}
	}
	//得分及障碍边界判断
	if (intersections4.length > 0) { //上方检测到障碍物
		flag = true;
	} else if (intersections5.length > 0) { //下方检测到障碍物
		flag = true;
	}
	if (intersections4.length == 0 && intersections5.length == 0) {
		if (flag == true) {
			score = score + 1;
			console.log("score: " + score);
			flag = false;
		}
	}

	if (birdmesh.position.z < 10) {
		birdmesh.position.z = 10;
	}
	if (birdmesh.position.z > 590) {
		birdmesh.position.z = 590;
	}
	mixer.update(0.017);
	camera.position.set(birdmesh.position.x + px, birdmesh.position.y + py, birdmesh.position.z + pz);
	renderer.clear();
	renderer.render(scene, camera);
}
