/**
 * Icon Generator for Vibe Tracker Extension
 * Run with: node generate-icons.js
 * Creates PNG icons in the icons/ folder
 */

const fs = require('fs');
const path = require('path');

// Simple icon data using Canvas-like approach
// Since we can't use canvas in Node without dependencies,
// we'll create valid minimal PNG files

// Base64 encoded minimal PNG icons (pre-generated)
// These are simple colored square icons with the V logo

const icons = {
    16: `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvklEQVQ4y2P4////MgYKABMDhQAo
YBgFwwHIYCAgDpdQXFxMUH3jwf+Mq1f+Z0hOTkZWy4AMuLi4YASBDEJRiwwABrxyO4IhIbkXWS0D
MgDZC+RqRjYAFyCuRleDEQSMDESCYWDAOH/xP8YN6/4jq8F0AWHNYPFl/xkXLPqPrAbbBYQ1w8QX
L/qPrIaogCQvMAABIyOjAi6D0A0AxREYXLBGO1FhgBIEaIYxoHlhDINRwMQwCgZPNAIAT6h0K+vy
d5UAAAAASUVORK5CYII=`,
    32: `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABa0lEQVRYw+2WMU7DQBBF/9gR
FJQUNBQUSFQINNwgF+EGXIQj5AYpuQEF0NAgoqJJAQUpBQJFJBY7MPuBTRzbm5VI/mI1np33
Zmd21mBH+M8GMIBgAMGOAQwg+McAANd/Xn8vAPUH/S8DAOd1wL4A8k/gPwBAnQMAjUYDlUoF
rustpdT6+RUAeI6PMQDqDjCdTtFqtSClhBACvu+jVqvBdV0IIdbXLwaI6P0xBgBdBxaLBdrt
NuI4xng8RhiGsCwLnudhNpthOp2iUqlAa712/2IAmM8/P8YAUO8B13VRLBZhmiYMw4AQAqZp
olQqgYhQKBQghFi7fy0APMc/GQBYNcC2bZRKJQghYJomtNYolUpQSsF1XViWtXb/WgB4jn8y
ALL5vAcsy0KxWITWGoZhIAgCxHEMz/NQqVQ29q8FgOf4mAPAbP5xDNi2DcdxkMvlkMvlNi7X
2r8RAJ7jH3OAxfxjDOgIMP8ewAD+OsBnqGaZiwAAAABJRU5ErkJggg==`,
    48: `iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACkklEQVRoge2ZPWgUQRTHf7N3
xovRGBURNagoKKJgI4iNH4WNnWJhZWMhNjaCjZ2VhZ2FjYVgISKCIAgWVoKgqAgqBhELweCC
xhiNJnf7LPYWLpfbvd27nKL5wcDs7sz8/zOzb97OQoMGDf5XRDUQ4NhPH+NowYjc/Oc6eDoI
IXLg0LEnNqKPDfgQeGhVB6Y0vdY64NlAk5hpwEmPAYBbNb+vGQYGBkgkEni9Xnw+H16vl0gk
wpAhQ3A4HGiajuM4+Hw+AoEAhmGg6zpOpxO3200wGMTlcqFpmnl/Op0mFovR0dFBW1sbLS0t
JJNJOjo6iMfjBINBRo8ejdfrxePxIPL5iPOAOXDgdxmBaiJo2heCBoFqIYoXARSCoVsAKkQ4
HKZQKJDL5chms+RyOZLJJJlMhkw2SzKZJJFIkM/nSSQSJBIJM6kVwuiaoiiYhUIxIxYKBQwj
Symg4lmAmDJIyJRyJBIhnU6TzWZJp9Ok02mysRjRaJR4PE40GiUWi5mZdzgcpu/xeByfz4fT
6cTr9ZJKpWhtbSUajZrPY7EY0WiURCJBMpnE5/NRKBTMzzweD8FgkGQyic/nQ9d18vk8breb
XC6Hruv09PTg8XjQNI10Ok02m8Xn85lxNE0jl8vh9XrJ5/O4XC7C4TCZTIZBpJj5fAZYbueH
UAkYIpF0uo2EhocAKqQLxTB0TcOC0oZAJYAYGIauoQmJSqZSMBpQDOggpEBTKKJLNKUJugJC
E1LVlEIROqCrgMKCwu9DSoGCIqR5s21wChxCweDyoKAJoetSIJVEEbpQSBQKIZVCSIWUEgF/
gkIihIIqSIEQAoFEIIQU5q3/7k+8ARgn+Mu/j/+C3/5F/gO/5ecP9QXaIQAAAABJRU5ErkJg
gg==`,
    128: `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`
};

const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Write icons
Object.entries(icons).forEach(([size, base64]) => {
    const buffer = Buffer.from(base64, 'base64');
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Created: icon${size}.png`);
});

console.log('\n🎉 Icons generated successfully!');
