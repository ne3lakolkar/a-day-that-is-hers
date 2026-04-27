// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

// --- 1. Global Setup & Particles ---
const sceneWrapper = document.getElementById('scene-wrapper');
const cameraAim = document.getElementById('camera-aim');
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 100;
let width, height;

// Handle resizing the window
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
}
window.addEventListener('resize', resize);
resize(); // Initialize

// Particle constructor
function Particle() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.z = Math.random() * 800 - 400; // Place particles in Z-space
    this.size = Math.random() * 1.5 + 0.5;
    this.baseSpeed = Math.random() * 0.15 + 0.05;
    this.speed = this.baseSpeed;
    this.opacity = Math.random() * 0.5 + 0.2;
}

// Particle prototype: Update position and draw
Particle.prototype.update = function(mx, my) {
    this.z += this.speed;

    // If particles fly past the "camera" reset them in the distance
    if (this.z > 200) {
        this.z = -800;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
    }

    // Perspective projection for 2D canvas
    const perspective = 1000 / (1000 + this.z);
    const projX = (this.x - width / 2) * perspective + width / 2;
    const projY = (this.y - height / 2) * perspective + height / 2;
    const projSize = this.size * perspective;

    // Subtle reaction to mouse movement
    this.x += (mx - width / 2) * 0.0001;
    this.y += (my - height / 2) * 0.0001;

    // React speed to scrolling
    this.speed = this.baseSpeed + (window.scrollY * 0.001);

    ctx.beginPath();
    ctx.arc(projX, projY, Math.max(0, projSize), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 240, 255, ${this.opacity})`;
    ctx.fill();
};

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

// Main animation loop
function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    
    // Smooth dynamic background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0b12'); // Deep Space
    gradient.addColorStop(0.5, '#131e30'); // Mid space
    gradient.addColorStop(1, `#1c2e4a`); // Blue Hour
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add glowing haze to Blue Hour
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(28, 46, 74, 0.4)';

    particles.forEach(p => p.update(mouseX, mouseY));
    requestAnimationFrame(animateParticles);
}

// Global mouse coordinates for particles to react
let mouseX = width / 2;
let mouseY = height / 2;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
initParticles();
animateParticles();

// --- 2. 3D Camera Movement (Mouse/Touch Tilt) ---
const MAX_TILT = 3.0; // Degrees to tilt

function updateCameraRotation(e) {
    // Current pointer position (relative to center)
    const px = e.clientX || e.touches[0].clientX;
    const py = e.clientY || e.touches[0].clientY;
    
    const cx = width / 2;
    const cy = height / 2;

    const dx = (px - cx) / cx; // -1 to 1
    const dy = (py - cy) / cy; // -1 to 1

    // Apply rotation based on distance from center
    const tiltX = dy * -MAX_TILT; // Pitch
    const tiltY = dx * MAX_TILT; // Yaw

    // Apply rotation to the camera object
    gsap.to(cameraAim, {
        duration: 0.15,
        rotationX: tiltX,
        rotationY: tiltY,
        ease: 'power1.out',
        overwrite: true
    });
}
sceneWrapper.addEventListener('mousemove', updateCameraRotation);
sceneWrapper.addEventListener('touchmove', updateCameraRotation);

// Reset camera tilt on leave
sceneWrapper.addEventListener('mouseleave', () => {
    gsap.to(cameraAim, { duration: 1.0, rotationX: 0, rotationY: 0, ease: 'power2.out' });
});

// --- 3. Poem Scoping & Stacking ---
const stanzas = gsap.utils.toArray('.stanza');
const finalPanel = document.querySelector('.final-panel');

// Dynamically stack the stanzas along the Y-axis to enable scrolling
let totalHeight = 0;
const SPACING = 150; // Extra pixel space between stanzas

stanzas.forEach((stanza, i) => {
    stanza.style.top = `${totalHeight}px`;
    totalHeight += stanza.offsetHeight + SPACING;
});

// Position the final panel after all the poem stanzas
finalPanel.style.top = `${totalHeight}px`;
totalHeight += finalPanel.offsetHeight;

// Set the scene wrapper height to allow natural scrolling
// Need to account for the Z-depth perspective to make scrolling feel right
// This is a rough estimation.
const zScalingFactor = 0.5; // Stanzas in distance require less scrolling to pass.
sceneWrapper.style.height = `${totalHeight * zScalingFactor}px`;

// --- 4. Interactive Stanza Progression (ScrollTrigger) ---
stanzas.forEach((stanza) => {
    gsap.fromTo(stanza, 
        { opacity: 0 }, // Initial hidden state
        { 
            opacity: 1, 
            duration: 1.5,
            ease: 'sine.inOut',
            scrollTrigger: {
                trigger: stanza,
                start: 'top 65%', // Start revealing when stanza is mostly in view
                end: 'top 15%', // Finish reveal as it passes up
                scrub: 1.0, // Match reveal progress to scroll progress
                markers: false // Set to true to debug
            }
        }
    );
});

// Special animation for the final birthday message
gsap.fromTo(finalPanel,
    { opacity: 0 },
    {
        opacity: 1,
        duration: 2.0,
        ease: 'power2.inOut',
        scrollTrigger: {
            trigger: finalPanel,
            start: 'top 80%',
            end: 'top center',
            scrub: 1.0
        }
    }
);
