export interface Ball {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

// Friction for slowing down the balls
export const friction = 0.999; 
// Friction on collision
export const collisionFriction = 0.99; 
// Ball radius for large screens
export const largeBallRadius = 30; 
// Ball radius for small screens
export const smallBallRadius = 20;
//border
export const borderThickness = 15;

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const handleCollision = (balls: Ball[]) => {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const dx = balls[j].x - balls[i].x;
      const dy = balls[j].y - balls[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = balls[i].radius + balls[j].radius;
      if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - distance;
        const percent = 0.5; // Split overlap equally for each ball
        const correction = (overlap / distance) * percent;
        const correctionX = correction * Math.cos(angle);
        const correctionY = correction * Math.sin(angle);

        // Correcting position to prevent balls from overlapping
        balls[i].x -= correctionX;
        balls[i].y -= correctionY;
        balls[j].x += correctionX;
        balls[j].y += correctionY;

        // Updating velocity post collision considering the loss in speed
        let tempVx = balls[i].vx;
        let tempVy = balls[i].vy;
        balls[i].vx = balls[j].vx * collisionFriction;
        balls[i].vy = balls[j].vy * collisionFriction;
        balls[j].vx = tempVx * collisionFriction;
        balls[j].vy = tempVy * collisionFriction;
      }
    }
  }
};

export const checkOverlap = (newBall: Ball, balls: Ball[]): boolean => {
  return balls.some(ball => {
    const dx = ball.x - newBall.x;
    const dy = ball.y - newBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + newBall.radius;
  });
};
