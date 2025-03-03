const { Engine, Render, World, Bodies, Body, Constraint } = Matter;

const engine = Engine.create();
const canvas = document.getElementById('gameCanvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: { wireframes: false, background: '#e0e0e0' }
});

// 낙서 스타일 지렁이
const head = Bodies.circle(400, 550, 20, { restitution: 0.5, render: { sprite: { texture: 'head.png' } } });
const tail = Bodies.circle(400, 570, 20, { restitution: 0.5, render: { sprite: { texture: 'tail.png' } } });
const bodyConstraint = Constraint.create({
    bodyA: head,
    bodyB: tail,
    length: 50,
    stiffness: 0.1,
    render: { strokeStyle: '#000', lineWidth: 3 }
});

// 낙서 스타일 장애물
const ground = Bodies.rectangle(400, 600, 800, 40, { isStatic: true, render: { sprite: { texture: 'ground.png' } } });
const platform1 = Bodies.rectangle(500, 400, 100, 20, { isStatic: true, render: { sprite: { texture: 'platform.png' } } });
const platform2 = Bodies.rectangle(300, 300, 80, 20, { isStatic: true, friction: 0.1, render: { sprite: { texture: 'platform.png' } } });

World.add(engine.world, [head, tail, bodyConstraint, ground, platform1, platform2]);

// 마우스 조작
let headGrabbed = false, tailGrabbed = false;
canvas.addEventListener('mousedown', (event) => {
    const mousePos = { x: event.offsetX, y: event.offsetY };
    if (event.button === 0 && (Matter.Bounds.contains(platform1.bounds, mousePos) || Matter.Bounds.contains(platform2.bounds, mousePos))) {
        Body.setPosition(head, mousePos);
        head.isStatic = true;
        headGrabbed = true;
        new Audio('grab.wav').play();
    } else if (event.button === 2 && (Matter.Bounds.contains(platform1.bounds, mousePos) || Matter.Bounds.contains(platform2.bounds, mousePos))) {
        Body.setPosition(tail, mousePos);
        tail.isStatic = true;
        tailGrabbed = true;
        new Audio('grab.wav').play();
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0 && headGrabbed) head.isStatic = false, headGrabbed = false;
    else if (event.button === 2 && tailGrabbed) tail.isStatic = false, tailGrabbed = false;
});

canvas.addEventListener('mousemove', (event) => {
    const mouseDelta = { x: event.movementX, y: event.movementY };
    if (!head.isStatic) {
        Body.applyForce(head, head.position, { x: mouseDelta.x * 0.05, y: mouseDelta.y * 0.05 });
        new Audio('stretch.wav').play();
    }
});

Matter.Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        if (pair.bodyA === ground || pair.bodyB === ground) new Audio('fall.wav').play();
    });
});

Engine.run(engine);
Render.run(render);
canvas.oncontextmenu = (e) => e.preventDefault();
