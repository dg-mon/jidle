const { Engine, Render, World, Bodies, Body, Constraint, Runner } = Matter;

const engine = Engine.create({ timing: { timeScale: 0 } }); // 처음에는 엔진 정지
const canvas = document.getElementById('gameCanvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: { width: 800, height: 600, wireframes: false, background: '#e0e0e0' }
});

engine.world.gravity.y = 5;

// 지렁이 생성
const head = Bodies.circle(400, 550, 20, { restitution: 0.1, mass: 5, render: { fillStyle: '#000' } });
const midBody = Bodies.circle(400, 560, 15, { restitution: 0.1, mass: 5, render: { fillStyle: '#000' } });
const tail = Bodies.circle(400, 570, 20, { restitution: 0.1, mass: 5, render: { fillStyle: '#000' } });

const headToMid = Constraint.create({ bodyA: head, bodyB: midBody, length: 30, stiffness: 0.05, damping: 0.2, render: { strokeStyle: '#000', lineWidth: 3 } });
const midToTail = Constraint.create({ bodyA: midBody, bodyB: tail, length: 30, stiffness: 0.05, damping: 0.2, render: { strokeStyle: '#000', lineWidth: 3 } });

const ground = Bodies.rectangle(400, 600, 800, 40, { isStatic: true, render: { fillStyle: '#808080' } });
const platform1 = Bodies.rectangle(500, 400, 100, 20, { isStatic: true, render: { fillStyle: '#808080' } });
const platform2 = Bodies.rectangle(300, 300, 80, 20, { isStatic: true, friction: 0.5, render: { fillStyle: '#808080' } });

World.add(engine.world, [head, midBody, tail, headToMid, midToTail, ground, platform1, platform2]);

let sensitivity = 0.0005;
const sensitivitySlider = document.getElementById('sensitivity');
sensitivitySlider.addEventListener('input', (event) => { sensitivity = parseFloat(event.target.value); });

let headGrabbed = false, tailGrabbed = false;

function grabBody(body) {
    const bounds = { 
        min: { x: body.position.x - 10, y: body.position.y - 10 }, 
        max: { x: body.position.x + 10, y: body.position.y + 10 } 
    };
    const nearbyBodies = Matter.Query.region([ground, platform1, platform2], bounds);
    if (nearbyBodies.length > 0) {
        body.isStatic = true;
        console.log(`${body === head ? 'Head' : 'Tail'} grabbed`);
        return true;
    }
    return false;
}

canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) headGrabbed = grabBody(head);
    else if (event.button === 2) tailGrabbed = grabBody(tail);
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0 && headGrabbed) { head.isStatic = false; headGrabbed = false; console.log('Head released'); }
    else if (event.button === 2 && tailGrabbed) { tail.isStatic = false; tailGrabbed = false; console.log('Tail released'); }
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
        x: (event.clientX - rect.left) * (render.options.width / rect.width),
        y: (event.clientY - rect.top) * (render.options.height / rect.height)
    };

    if (headGrabbed && !tailGrabbed) {
        const direction = { x: mousePos.x - midBody.position.x, y: mousePos.y - midBody.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(tail, tail.position, force);
        Body.applyForce(midBody, midBody.position, force);
    } else if (!headGrabbed && tailGrabbed) {
        const direction = { x: mousePos.x - midBody.position.x, y: mousePos.y - midBody.position.y };
        const force = { x: direction.x * sensitivity, y: direction.y * sensitivity };
        Body.applyForce(head, head.position, force);
        Body.applyForce(midBody, midBody.position, force);
    }
});

function updateCamera() {
    const headPos = head.position, tailPos = tail.position;
    const targetX = (headPos.x + tailPos.x) / 2, targetY = (headPos.y + tailPos.y) / 2;
    const currentX = render.bounds.min.x + render.options.width / 2, currentY = render.bounds.min.y + render.options.height / 2;
    const lerpX = currentX + (targetX - currentX) * 0.05, lerpY = currentY + (targetY - currentY) * 0.05;
    Render.lookAt(render, { min: { x: lerpX - render.options.width / 2, y: lerpY - render.options.height / 2 }, max: { x: lerpX + render.options.width / 2, y: lerpY + render.options.height / 2 } });
}

// 게임 초기화 및 시작
const runner = Runner.create();
const startScreen = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    console.log('Start button clicked');
    document.getElementById('startScreen').style.display = 'none';
    engine.timing.timeScale = 1; // 엔진 활성화
    Runner.run(runner, engine); // 물리 엔진 실행
    Render.run(render); // 렌더링 시작
    Matter.Events.on(engine, 'beforeUpdate', updateCamera); // 카메라 업데이트
});

canvas.oncontextmenu = (e) => e.preventDefault();
