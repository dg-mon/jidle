const { Engine, Render, World, Bodies, Body, Constraint, Runner } = Matter;

const engine = Engine.create();
const canvas = document.getElementById('gameCanvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#e0e0e0'
    }
});

engine.world.gravity.y = 2;

const head = Bodies.circle(400, 550, 20, { restitution: 0.5, mass: 1, render: { fillStyle: '#000' } });
const tail = Bodies.circle(400, 570, 20, { restitution: 0.5, mass: 1, render: { fillStyle: '#000' } });
const bodyConstraint = Constraint.create({
    bodyA: head,
    bodyB: tail,
    length: 50,
    stiffness: 0.1,
    render: { strokeStyle: '#000', lineWidth: 3 }
});

const ground = Bodies.rectangle(400, 600, 800, 40, { isStatic: true, render: { fillStyle: '#808080' } });
const platform1 = Bodies.rectangle(500, 400, 100, 20, { isStatic: true, render: { fillStyle: '#808080' } });
const platform2 = Bodies.rectangle(300, 300, 80, 20, { isStatic: true, friction: 0.1, render: { fillStyle: '#808080' } });

World.add(engine.world, [head, tail, bodyConstraint, ground, platform1, platform2]);

let sensitivity = 0.01;
const sensitivitySlider = document.getElementById('sensitivity');
sensitivitySlider.addEventListener('input', (event) => {
    sensitivity = parseFloat(event.target.value);
});

let headGrabbed = false, tailGrabbed = false;
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
        x: (event.clientX - rect.left) * (render.options.width / rect.width),
        y: (event.clientY - rect.top) * (render.options.height / rect.height)
    };
    if (event.button === 0) {
        if (Matter.Bounds.contains(platform1.bounds, mousePos) || Matter.Bounds.contains(platform2.bounds, mousePos) || Matter.Bounds.contains(ground.bounds, mousePos)) {
            Body.setPosition(head, mousePos);
            head.isStatic = true;
            headGrabbed = true;
        }
    } else if (event.button === 2) {
        if (Matter.Bounds.contains(platform1.bounds, mousePos) || Matter.Bounds.contains(platform2.bounds, mousePos) || Matter.Bounds.contains(ground.bounds, mousePos)) {
            Body.setPosition(tail, mousePos);
            tail.isStatic = true;
            tailGrabbed = true;
        }
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0 && headGrabbed) {
        head.isStatic = false;
        headGrabbed = false;
    } else if (event.button === 2 && tailGrabbed) {
        tail.isStatic = false;
        tailGrabbed = false;
    }
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseDelta = {
        x: event.movementX * (render.options.width / rect.width),
        y: event.movementY * (render.options.height / rect.height)
    };
    if (!head.isStatic) {
        Body.applyForce(head, head.position, { x: mouseDelta.x * sensitivity, y: mouseDelta.y * sensitivity });
    } else if (!tail.isStatic) {
        Body.applyForce(tail, tail.position, { x: mouseDelta.x * sensitivity, y: mouseDelta.y * sensitivity });
    }
});

// 카메라 스무스 추적
function updateCamera() {
    const headPos = head.position;
    const tailPos = tail.position;
    const targetX = (headPos.x + tailPos.x) / 2;
    const targetY = (headPos.y + tailPos.y) / 2;
    const currentX = render.bounds.min.x + render.options.width / 2;
    const currentY = render.bounds.min.y + render.options.height / 2;

    const lerpX = currentX + (targetX - currentX) * 0.05;  // 스무스 이동
    const lerpY = currentY + (targetY - currentY) * 0.05;

    Render.lookAt(render, {
        min: { x: lerpX - render.options.width / 2, y: lerpY - render.options.height / 2 },
        max: { x: lerpX + render.options.width / 2, y: lerpY + render.options.height / 2 }
    });
}

// 게임 시작 로직
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    Runner.run(engine);
    Render.run(render);

    // 카메라 업데이트 루프
    Matter.Events.on(engine, 'beforeUpdate', updateCamera);
});

canvas.oncontextmenu = (e) => e.preventDefault();
