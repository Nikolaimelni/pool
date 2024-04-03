import React, { useRef, useEffect, useState } from 'react';
import './index.css';
import {
  Ball,
  checkOverlap,
  collisionFriction,
  friction,
  getRandomColor,
  handleCollision,
  largeBallRadius,
  smallBallRadius,
  borderThickness
} from './helpers';


const Pool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const ballRadius = screenWidth > 768 ? largeBallRadius : smallBallRadius;

      const newBalls: Ball[] = [];
      const columns = 3;
      const rows = 4;
      const spacing = 2 * ballRadius; // Distance between balls
      const totalWidth = columns * ballRadius * 2 + (columns - 1) * spacing;
      const totalHeight = rows * ballRadius * 2 + (rows - 1) * spacing;
      const xOffset = (screenWidth - totalWidth) / 2;
      const yOffset = (screenHeight - totalHeight) / 2 + borderThickness;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          newBalls.push({
            x: xOffset + j * (2 * ballRadius + spacing) + ballRadius,
            y: yOffset + i * (2 * ballRadius + spacing) + ballRadius,
            radius: ballRadius,
            color: getRandomColor(),
            vx: 0,
            vy: 0,
          });
        }
      }
      setBalls(newBalls);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call it initially to set up the balls

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main rendering and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Drawing the border
      context.fillStyle = '#8B4513';
      context.fillRect(0, 0, canvas.width, borderThickness); // Top border
      context.fillRect(0, canvas.height - borderThickness, canvas.width, borderThickness); // Bottom border
      context.fillRect(0, 0, borderThickness, canvas.height); // Left border
      context.fillRect(canvas.width - borderThickness, 0, borderThickness, canvas.height); // Right border

      balls.forEach(ball => {
        handleCollision(balls);
        // Apply friction to slow down movement
        ball.vx *= friction;
        ball.vy *= friction;

        if (ball.x + ball.vx > canvas.width - ball.radius - borderThickness || ball.x + ball.vx < ball.radius + borderThickness) {
          ball.vx = -ball.vx * collisionFriction;
        }
        if (ball.y + ball.vy > canvas.height - ball.radius - borderThickness || ball.y + ball.vy < ball.radius + borderThickness) {
          ball.vy = -ball.vy * collisionFriction;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        context.fillStyle = ball.color;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
      });

      requestAnimationFrame(render);
    };

    render();
  }, [balls]);

  // Mouse and touch event handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mouseX: number, mouseY: number;
    if (event.type === 'mousemove') {
      mouseX = (event as React.MouseEvent<HTMLCanvasElement>).clientX - canvas.getBoundingClientRect().left;
      mouseY = (event as React.MouseEvent<HTMLCanvasElement>).clientY - canvas.getBoundingClientRect().top;
    } else if (event.type === 'touchmove') {
      mouseX = (event as React.TouchEvent<HTMLCanvasElement>).touches[0].clientX - canvas.getBoundingClientRect().left;
      mouseY = (event as React.TouchEvent<HTMLCanvasElement>).touches[0].clientY - canvas.getBoundingClientRect().top;
    } else {
      return;
    }

    balls.forEach(ball => {
      const distance = Math.sqrt((ball.x - mouseX) ** 2 + (ball.y - mouseY) ** 2);
      const pushForce = 0.5;

      if (distance < ball.radius + 10) {
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        ball.vx = (dx / distance) * pushForce;
        ball.vy = (dy / distance) * pushForce;
      }
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedBallIndex = balls.findIndex(ball => {
      const distance = Math.sqrt((ball.x - mouseX) ** 2 + (ball.y - mouseY) ** 2);
      return distance < ball.radius;
    });

    if (clickedBallIndex !== -1) {
      setSelectedBallIndex(clickedBallIndex);
    } else {
      setSelectedBallIndex(null);
    }
  };

  const handleRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const newBall: Ball = {
      x: mouseX,
      y: mouseY,
      radius: window.innerWidth > 768 ? largeBallRadius : smallBallRadius,
      color: getRandomColor(),
      vx: 0,
      vy: 0,
    };
    // Avoid adding a new ball if it overlaps existing ones
    if (!checkOverlap(newBall, balls)) {
      setBalls(prevBalls => [...prevBalls, newBall]);
    }
  };

  const handleChangeColor = (color: string) => {
    if (selectedBallIndex !== null) {
      setBalls(balls.map((ball, index) => index === selectedBallIndex ? { ...ball, color } : ball));
      setSelectedBallIndex(null); // Deselect the ball after changing its color
    }
  };

  const handleDeleteBall = () => {
    if (selectedBallIndex !== null) {
      setBalls(balls.filter((_, index) => index !== selectedBallIndex));
      setSelectedBallIndex(null); // Deselect the ball after changing its color
    }
  };

  // Close the menu if clicked outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedBallIndex !== null && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSelectedBallIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedBallIndex]);

  return (
    <div className="container">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />
      {selectedBallIndex !== null && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            left: `${balls[selectedBallIndex]?.x}px`,
            top: `${balls[selectedBallIndex]?.y}px`,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#FFF',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <input type="color" onChange={(e) => handleChangeColor(e.target.value)} />
          <button className="delete-button" onClick={handleDeleteBall}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default Pool;
