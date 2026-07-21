import React, { useEffect, useRef } from 'react';
import FragmentCanvas from 'fragment-canvas';

interface SomaticShaderCanvasProps {
  colorA?: [number, number, number]; // RGB normalized 0-1
  colorB?: [number, number, number]; // RGB normalized 0-1
  className?: string;
  intensity?: number;
}

const defaultShader = `
    precision mediump float;

    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uIntensity;

    float random(vec2 pos) {
        return fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 pos) {
        vec2 i = floor(pos);
        vec2 f = fract(pos);
        float a = random(i + vec2(0.0, 0.0));
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 pos) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(20.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; i++) {
            v += a * noise(pos);
            pos = rot * pos * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main(void) {
        vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        uv *= 0.8;

        vec2 q = vec2(
            fbm(uv + 0.15 * iTime),
            fbm(uv + 5.2)
        );
        vec2 r = vec2(
            fbm(uv + 2.0 * q + 0.15 * iTime),
            fbm(uv + 2.0 * q + 1.2)
        );
        
        float f = fbm(uv + r);
        
        vec3 color = mix(
            vec3(0.02, 0.02, 0.05),
            uColorA,
            clamp((f * f) * 4.0, 0.0, 1.0)
        );

        color = mix(
            color,
            uColorB,
            clamp(length(q), 0.0, 1.0)
        );

        color = mix(
            color,
            vec3(1.0, 1.0, 1.0),
            clamp(length(r.x) * 0.2, 0.0, 0.1)
        );

        vec3 finalColor = (f * f * f + 0.6 * f * f + 0.5 * f) * color * uIntensity;
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const SomaticShaderCanvas: React.FC<SomaticShaderCanvasProps> = ({
  colorA = [0.0, 0.5, 1.0],
  colorB = [0.5, 0.0, 1.0],
  className = "",
  intensity = 1.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    fcRef.current = new FragmentCanvas(canvas, {
      fragmentShader: defaultShader,
      uniforms: {
        uColorA: (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => gl.uniform3fv(loc, colorA),
        uColorB: (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => gl.uniform3fv(loc, colorB),
        uIntensity: (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => gl.uniform1f(loc, intensity),
      }
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      if (fcRef.current && fcRef.current.destroy) {
        fcRef.current.destroy();
      }
    };
  }, [colorA, colorB, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
