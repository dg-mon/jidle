const { Engine, Render, World, Bodies, Body, Constraint, Runner, Composite } = Matter;

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

engine.world.gravity.y = 3;

// 지렁이 (중앙 몸통 추가)
const head = Bodies.circle(400, 550, 20, { restitution: 0.3, mass: 1, render: { fillStyle: '#000' } });
const tail = Bodies.circle(400, 570, 20, { restitution: 0.3, mass: 1, render: { fillStyle: '#000' } });
const midBody = Bodies.circle(400, 560, 15, { restitution: 0.3, mass: 1, render: { fillStyle: '#000' } });
const headToMid = Constraint.create({
    bodyA: head,
    bodyB: midBody,
    length: 30,
    stiffness: 0.2,
    damping: 0.1,
    render: { strokeStyle: '#000', lineWidth: 3 }
});
const midToTail = Constraint.create({
    bodyA: midBody,
    bodyB: tail,
    length: 30,
    stiffness: 0.2,
    damping: 0.1,
    render: { strokeStyle: '#000', lineWidth: 3 }
});

const ground = Bodies.rectangle(400, 600, 800, 40, { isStatic: true, render: { fillStyle: '#808080' } });
const platform1 = Bodies.rectangle(500, 400, 100, 20, { isStatic: true, render: { fillStyle: '#808080' } });
const platform2 = Bodies.rectangle(300, 300, 80, 20, { isStatic: true, friction: 0.2, render: { fillStyle: '#808080' } });

World.add(engine.world, [head, midBody, tail, headToMid, midToTail, ground, platform1, platform2]);

let sensitivity = 0.005;
const sensitivitySlider = document.getElementById('sensitivity');
sensitivitySlider.addEventListener('input', (event) => {
    sensitivity = parseFloat(event.target.value);
});

let headGrabbed = false, tailGrabbed = false;

// 그랩 체크 함수
function checkGrab(body, mousePos) {
    const nearbyBodies = Matter.Query.point([ground, platform1, platform2], body.position);
    if (nearbyBodies.length > 0) {
        Body.setPosition(body, { x: body.position.x, y: body.position.y });
        body.isStatic = true;
        return true;
    }
    return false;
}

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
        x: (event.clientX - rect.left) * (render.options.width / rect.width),
        y: (event.clientY - rect.top) * (render.options.height / rect.height)
    };
    if (event.button === 0) {  // 좌클릭: 머리 그랩
        headGrabbed = checkGrab(head, mousePos);
    } else if (event.button === 2) {  // 우클릭: 꼬리 그랩
        tailGrabbed = checkGrab(tail, mousePos);
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
    const mousePos = {
        x: (event.clientX - rect.left) * (render.options.width / rect.width),
        y: (event.clientY - rect.top) * (render.options.height / rect.height)
    };
    const mouseDelta = {
        x: event.movementX * (render.options.width / rect.width),
        y: event.movementY * (render.options.height / rect.height)
    };

    // 조작 로직
    if (!headGrabbed && !tailGrabbed) {  // 둘 다 안 잡음
        const force = { x: mouseDelta.x * sensitivity, y: mouseDelta.y * sensitivity };
        Body.applyForce(midBody, midBody.position, force);
    } else if (headGrabbed && tailGrabbed) {  // 둘 다 잡음
        const force = { x: mouseDelta.x * sensitivity, y: mouseDelta.y * sensitivity };
        Body.applyForce(midBody, midBody.position, force);
    } else if (headGrabbed && !tailGrabbed) {  // 머리만 잡음
        const direction = { x: mousePos.x - midBody.position.x, y: mousePos.y - midBody.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(tail, tail.position, force);
    } else if (!headGrabbed && tailGrabbed) {  // 꼬리만 잡음
        const direction = { x: mousePos.x - midBody.position.x, y: mousePos.y - midBody.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(head, head.position, force);
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

    const lerpX = currentX + (targetX - currentX) * 0.05;
    const lerpY = currentY + (targetY - currentY) * 0.05;

    Render.lookAt(render, {
        min: { x: lerpX - render.options.width / 2, y: lerpY - render.options.height / 2 },
        max: { x: lerpX + render.options.width / 2, y: lerpY + render.options.height / 2 }
    });
}

const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    Runner.run(engine);
    Render.run(render);
    Matter.Events.on(engine, 'beforeUpdate', updateCamera);
});

canvas.oncontextmenu = (e) => e.preventDefault();
