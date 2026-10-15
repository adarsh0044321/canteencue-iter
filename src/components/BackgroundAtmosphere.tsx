import React, { useEffect, useRef } from "react";

export const BackgroundAtmosphere: React.FC = () => {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !tiltRef.current) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mouseX = x * 8; // max degrees
      mouseY = -y * 5;
    };

    const handleMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    const updateTilt = () => {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(1200px) rotateX(${currentY.toFixed(2)}deg) rotateY(${currentX.toFixed(2)}deg) scale(1.03)`;
      }
      animationFrameId = requestAnimationFrame(updateTilt);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    animationFrameId = requestAnimationFrame(updateTilt);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div aria-hidden="true" className="hero__bg" style={{ pointerEvents: "none", userSelect: "none" }}>
      <div className="hero__tilt-wrapper" ref={tiltRef} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div className="hero__cinema-frame" style={{ pointerEvents: "none", userSelect: "none" }}>
          <img
            alt="Artistic cafe dining interior with premium coffee and bakery mural"
            className="hero__bg-media"
            decoding="async"
            loading="eager"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            src="/cafe_bg.jpg"
            style={{ pointerEvents: "none", userSelect: "none" }}
          />
        </div>
      </div>
      <div className="hero__ambience"></div>
      <div className="hero__light-ray"></div>
      <div className="steam-container">
        <div className="steam-orb"></div>
        <div className="steam-orb"></div>
      </div>
    </div>
  );
};
