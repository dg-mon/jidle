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

engine.world.gravity.y = 3;  // 중력 강화

// 지렁이 (머리와 꼬리 연결)
const head = Bodies.circle(400, 550, 20, { restitution: 0.3, mass: 2, render: { fillStyle: '#000' } });
const tail = Bodies.circle(400, 570, 20, { restitution: 0.3, mass: 2, render: { fillStyle: '#000' } });
const bodyConstraint = Constraint.create({
    bodyA: head,
    bodyB: tail,
    length: 50,
    stiffness: 0.2,  // 수축/늘림 강도
    damping: 0.1,    // 반동 감쇠
    render: { strokeStyle: '#000', lineWidth: 3 }
});

const ground = Bodies.rectangle(400, 600, 800, 40, { isStatic: true, render: { fillStyle: '#808080' } });
const platform1 = Bodies.rectangle(500, 400, 100, 20, { isStatic: true, render: { fillStyle: '#808080' } });
const platform2 = Bodies.rectangle(300, 300, 80, 20, { isStatic: true, friction: 0.2, render: { fillStyle: '#808080' } });

World.add(engine.world, [head, tail, bodyConstraint, ground, platform1, platform2]);

let sensitivity = 0.005;
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
    const mousePos = {
        x: (event.clientX - rect.left) * (render.options.width / rect.width),
        y: (event.clientY - rect.top) * (render.options.height / rect.height)
    };
    const mouseDelta = {
        x: event.movementX * (render.options.width / rect.width),
        y: event.movementY * (render.options.height / rect.height)
    };

    // 머리 또는 꼬리가 고정된 상태에서 스윙/점프
    if (headGrabbed && !tail.isStatic) {
        const direction = { x: mousePos.x - head.position.x, y: mousePos.y - head.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(tail, tail.position, force);  // 꼬리에 힘 적용
    } else if (tailGrabbed && !head.isStatic) {
        const direction = { x: mousePos.x - tail.position.x, y: mousePos.y - tail.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(head, head.position, force);  // 머리에 힘 적용
    } else if (!headGrabbed && !tailGrabbed) {
        // 둘 다 안 잡혔을 때 수축 후 점프
        const currentLength = Matter.Vector.magnitude(Matter.Vector.sub(head.position, tail.position));
        if (currentLength > bodyConstraint.length) {
            const jumpForce = { x: mouseDelta.x * sensitivity * 2, y: mouseDelta.y * sensitivity * 2 };
            Body.applyForce(head, head.position, jumpForce);
            Body.applyForce(tail, tail.position, { x: -jumpForce.x, y: -jumpForce.y });
        }
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
