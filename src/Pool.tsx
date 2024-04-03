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
  smallBallRadius
} from './helpers';

const Pool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);

  // Handle window resizing and ball arrangement
  useEffect(() => {
    const handleResize = () => {
      // Define the screen dimensions and ball radius based on screen width
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const ballRadius = screenWidth > 768 ? largeBallRadius : smallBallRadius;

      // Create an initial layout of balls on the screen
      const newBalls = [];
      const columns = 3;
      const rows = 4;
      const spacing = 2 * ballRadius; // Distance between balls
      const totalWidth = columns * ballRadius * 2 + (columns - 1) * spacing;
      const totalHeight = rows * ballRadius * 2 + (rows - 1) * spacing;
      const xOffset = (screenWidth - totalWidth) / 2;
      const yOffset = (screenHeight - totalHeight) / 2;

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
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      balls.forEach(ball => {
        handleCollision(balls); // Check and handle any collisions between balls

        // Apply friction to slow down movement
        ball.vx *= friction;
        ball.vy *= friction;

        // Check for canvas boundaries and reverse velocity if a ball hits a wall
        if (ball.x + ball.vx > canvas.width - ball.radius || ball.x + ball.vx < ball.radius) {
          ball.vx = -ball.vx * collisionFriction;
        }
        if (ball.y + ball.vy > canvas.height - ball.radius || ball.y + ball.vy < ball.radius) {
          ball.vy = -ball.vy * collisionFriction;
        }

        // Move the ball by its velocity
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Draw the ball
        context.fillStyle = ball.color;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
      });

      requestAnimationFrame(render);
    };

    render();
  }, [balls]);

  // Mouse event handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedBallIndex === null) { // Only apply force if no ball is selected
      const rect = canvasRef.current?.getBoundingClientRect();
      const mouseX = event.clientX - (rect?.left ?? 0);
      const mouseY = event.clientY - (rect?.top ?? 0);

      balls.forEach((ball, index) => {
        const distance = Math.sqrt((ball.x - mouseX) ** 2 + (ball.y - mouseY) ** 2);
        if (distance < ball.radius + 10) { // Apply a small force to the ball on mouse over
          const pushForce = 0.5;
          const dx = mouseX - ball.x;
          const dy = mouseY - ball.y;
          ball.vx = (dx / distance) * pushForce;
          ball.vy = (dy / distance) * pushForce;
        }
      });
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const mouseX = event.clientX - (rect?.left ?? 0);
    const mouseY = event.clientY - (rect?.top ?? 0);

    // Determine if a ball was clicked
    const clickedBallIndex = balls.findIndex(ball => {
      const distance = Math.sqrt((ball.x - mouseX) ** 2 + (ball.y - mouseY) ** 2);
      return distance < ball.radius;
    });

    if (clickedBallIndex !== -1) {
      setSelectedBallIndex(clickedBallIndex);
    } else {
      setSelectedBallIndex(null); // Deselect if clicked outside any ball
    }
  };

  const handleRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const mouseX = event.clientX - (rect?.left ?? 0);
    const mouseY = event.clientY - (rect?.top ?? 0);

    // Add a new ball on right-click
    setBalls(prevBalls => {
      const newBall: Ball = {
        x: mouseX,
        y: mouseY,
        radius: window.innerWidth > 768 ? largeBallRadius : smallBallRadius,
        color: getRandomColor(),
        vx: 0,
        vy: 0,
      };

      if (!checkOverlap(newBall, prevBalls)) {
        return [...prevBalls, newBall];
      }
      return prevBalls; // Avoid adding a new ball if it overlaps existing ones
    });
  };

  // Color change and ball deletion handlers
  const handleChangeColor = (color: string) => {
    if (selectedBallIndex !== null) {
      setBalls(balls.map((ball, index) => index === selectedBallIndex ? { ...ball, color } : ball));
      setSelectedBallIndex(null); // Deselect the ball after changing its color
    }
  };

  const handleDeleteBall = () => {
    if (selectedBallIndex !== null) {
      setBalls(balls.filter((_, index) => index !== selectedBallIndex));
      setSelectedBallIndex(null); // Deselect the ball after deletion
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
