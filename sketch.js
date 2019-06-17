"use strict";

// sketch

class Charge {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.force = createVector(0, 0);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let finishedDrawing = false, movingCharge = false, start = 0;

let points = buckets.LinkedList();
let charges = buckets.LinkedList();

const C = {
    M: 5, // for greater accuracy reduce mass and
    Q: 0.005, // increase charge and
    K: 8.99 * 2 * 10 ** 4, // reduce exponent
    RAND: 800,
    FRICTION: 0.98
};

let boundColor;
let insideColor, ir, ig, ib, ia;
let presetShape = "";

function setPresetDrawing(name) {
    clearAll();
    presetShape = name;
    finishedDrawing = true;
    loadPixels();
}

function setup() {
    const canvas = createCanvas(500, 500);
    canvas.parent('sketch-holder');
    canvas.style('border', '1px solid black');
    canvas.style('width', '100%');
    canvas.style('height', '100%');
    // canvas.resizeCanvas();
    boundColor = color(0, 0, 0, 255);
    insideColor = color(255, 255, 255, 255);
    ir = red(insideColor);
    ig = green(insideColor);
    ib = blue(insideColor);
    ia = alpha(insideColor);
    background(insideColor);
    stroke(boundColor);
    strokeWeight(2);
    fill(255, 0);
    pixelDensity(1);

    circle_button.onclick = e => {
        setPresetDrawing("circle");
    };
    dogbone_button.onclick = e => {
        setPresetDrawing("dogbone");
    };
    cctri_button.onclick = e => {
        setPresetDrawing("cctri");

    };
}

function drawPresetShape() {
    if (presetShape === "circle") {
        circle(width / 2, height / 2, min(width, height) / 1.5);
    } else if (presetShape === "dogbone") {
        const y = height / 2, d = min(width, height) / 4, r = d / 2;
        const cxr = width / 2 + width / 4, cxl = width / 2 - width / 4, theta = PI / 1.2;
        arc(cxr, height / 2, d, d, -theta, theta);
        arc(cxl, height / 2, d, d, PI - theta, PI + theta);
        line(cxr + r * Math.cos(-theta), y + r * Math.sin(-theta), cxl + r * Math.cos(PI + theta), y + r * Math.sin(PI + theta));
        line(cxr + r * Math.cos(theta), y + r * Math.sin(theta), cxl + r * Math.cos(PI - theta), y + r * Math.sin(PI - theta));

    } else if (presetShape === "cctri") {
        const r = min(width, height) / 1.2;
        const cx = width / 2, cy = height / 2;
        const theta = 2 * PI / 3;
        const cx0 = cx + r * Math.cos(PI / 2), cy0 = cy + r * Math.sin(PI / 2),
            cx1 = cx + r * Math.cos(PI / 2 + theta), cy1 = cy + r * Math.sin(PI / 2 + theta),
            cx2 = cx + r * Math.cos(PI / 2 + 2 * theta), cy2 = cy + r * Math.sin(PI / 2 + 2 * theta);
        arc(cx0, cy0, r * Math.sqrt(3), r * Math.sqrt(3), 4 * PI / 3, 5 * PI / 3); // i hate geometry
        arc(cx1, cy1, r * Math.sqrt(3), r * Math.sqrt(3), 0, PI / 3);
        arc(cx2, cy2, r * Math.sqrt(3), r * Math.sqrt(3), 2 * PI / 3, PI);
    }
}

function draw() {
    resetScreen();
    updateShape();
    drawPresetShape();
    moveCharges();
    updateGraph();
}


function onCanvas(x, y) {
    return x >= 0 && y >= 0 && x < width && y < height;
}

function moveCharges() {
    if (movingCharge) {
        let f = createVector(0, 0, 0);
        charges.forEach(c => {
            charges.forEach(o => {
                if (c !== o) {
                    f.set(p5.Vector.sub(c.pos, o.pos));
                    f.setMag(C.K * C.Q * C.Q / dist(c.pos.x, c.pos.y, o.pos.x, o.pos.y));
                    c.force.add(f);
                }
            });
        });
        charges.forEach(c => {
            c.velocity.add(c.force.div(C.M)).mult(C.FRICTION);
            c.pos.add(c.velocity);
            if (!onCanvas(c.pos.x, c.pos.y) || pixelIsInsideColor(Math.floor(c.pos.x), Math.floor(c.pos.y))) {
                c.pos.sub(c.velocity);
                c.velocity.rotate(Math.random() * Math.PI * 2).div(2); // magic :)
            }
            circle(c.pos.x, c.pos.y, 10);
        });
    }
}

function updateGraph() {
    if (movingCharge) {
        let potentialEnergy = 0;
        let i = 0;
        charges.forEach(c => {
            let j = 0;
            charges.forEach(o => {
                if (j > i) {
                    potentialEnergy -= C.K * C.Q * C.Q * Math.log(dist(c.pos.x, c.pos.y, o.pos.x, o.pos.y));
                }
                j++;
            });
            i++;
        });
        const diff = frameCount - start;
        if (Math.floor(Math.random() * (diff) / 10) === 0) {
            // if (false) {
            chart.data.labels.push(diff);
            chart.data.datasets.forEach(dataset => {
                dataset.data.push(potentialEnergy);
            });
            chart.update();
        }
    }
}

function updateShape() {
    beginShape();
    points.forEach((p) => {
        vertex(p.x, p.y)
    });
    endShape();
    if (!finishedDrawing && mouseIsPressed && onCanvas(mouseX, mouseY)) {
        points.add(new Point(mouseX, mouseY));
    }
}

function clearAll() {
    points.clear();
    charges.clear();
    chart.data.labels = [0];
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });
    chart.update();
    finishedDrawing = movingCharge = false;
    presetShape = "";
}

function keyPressed() {
    if (key === 'c') {
        clearAll();
    } else if (key === 'd' && !points.isEmpty() && !finishedDrawing) {
        finishedDrawing = true;
        loadPixels();
        points.add(new Point(points.first().x, points.first().y));
    } else if (key === 'q' && finishedDrawing && !movingCharge) {
        distributeCharge();
        movingCharge = true;
        start = frameCount;
    }
}

function distributeCharge() {
    let bfsq = new buckets.Queue();
    bfsq.add(new Point(Math.floor(mouseX), Math.floor(mouseY)));
    while (!bfsq.isEmpty()) {
        let cur = bfsq.peek();
        if (pixelIsInsideColor(cur.x, cur.y)) {
            set(cur.x, cur.y, boundColor);
            if (Math.floor(Math.random() * C.RAND) === 0) {
                charges.add(new Charge(cur.x, cur.y));
            }
            bfsq.add(new Point(cur.x + 1, cur.y));
            bfsq.add(new Point(cur.x - 1, cur.y));
            bfsq.add(new Point(cur.x, cur.y + 1));
            bfsq.add(new Point(cur.x, cur.y - 1));
        }
        bfsq.dequeue();
    }
}

function resetScreen() {
    background(insideColor);
}

function pixelIsInsideColor(x, y) {
    const off = 4 * (y * width + x);
    return pixels[off] === ir && pixels[off + 1] === ig && pixels[off + 2] === ib && pixels[off + 3] === ia;
}


// sliders

let sliders = [
    ["mass", "M"],
    ["charge", "Q", v => {
        return v / 1000
    }],
    ["density", "RAND", v => {
        return 1000 / v
    }],
    ["friction", "FRICTION"]
];

sliders.forEach(sp => {
    if (sp.length < 3)
        sp[2] = v => {
            return v
        };
    let sname = sp[0];
    let slider = document.getElementById(sname);
    let sliderOut = document.getElementById(sname[0] + "v");
    slider.oninput = () => {
        let v = parseFloat(slider.value);
        sliderOut.value = v;
        C[sp[1]] = sp[2](v);
    }
});

// chart

const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [0],
        datasets: [{
            label: 'Potential Energy (J)',
            backgroundColor: '#007bff',
            borderColor: 'black',
            data: []
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                gridLines: {
                    display: false
                },
                scaleLabel: {
                    display: true,
                    labelString: "Frame No."
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: "Potential Energy (J)"
                }
            }]
        }
    }
});

// buttons

const circle_button = document.getElementById('circle');
const dogbone_button = document.getElementById('dogbone');
const cctri_button = document.getElementById('cctri');
