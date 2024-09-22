// backgroundShader.js
import { ShaderMaterial, Vector2, Color } from 'three';

const createBackgroundShaderMaterial = () => {
    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
        u_color1: { value: new Color(0xf7e8b4) }, // Yellow color
        u_color2: { value: new Color(0xe9d7eb) } // Rose color
    };

    const shaderMaterial = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_color1; // Yellow color
            uniform vec3 u_color2; // Rose color
            varying vec2 vUv;

            // Simplex Noise Function
            vec3 mod289(vec3 x) {
                return x - floor(x / 289.0) * 289.0;
            }

            vec2 mod289(vec2 x) {
                return x - floor(x / 289.0) * 289.0;
            }

            vec3 permute(vec3 x) {
                return mod289(((x*34.0)+1.0)*x);
            }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                                    -0.577350269189626, // -1.0 + 2.0 * C.x
                                    0.024390243902439); // 1.0 / 41.0
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);

                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;

                i = mod289(i); // Avoid truncation effects in permutation
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                                + i.x + vec3(0.0, i1.x, 1.0 ));

                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;

                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;

                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

                vec3 g;
                g.x  = a0.x  * x0.x + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;

                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;

                // Coordinates with origin at bottom right
                vec2 pos = vec2(1.0 - st.x, st.y);

                // Distance from bottom right corner
                float dist = length(pos);

                // Add wavy deformation with pulsation
                float noiseScale = 3.0;
                float baseNoiseStrength = 0.2;
                float pulsationSpeed = 0.2;
                float amplitude = 0.1;
                float noiseStrength = baseNoiseStrength + sin(u_time * pulsationSpeed) * amplitude;

                float n = snoise(pos * noiseScale + u_time * 0.1);
                dist += n * noiseStrength;

                // Normalize distance
                float gradient = smoothstep(0.0, 1.414, dist);

                // Bias gradient to make it more rose
                gradient = gradient * 0.7 + 0.3;

                // Mix colors based on gradient
                vec3 color = mix(u_color1, u_color2, gradient);

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    return shaderMaterial;
};

export default createBackgroundShaderMaterial;
