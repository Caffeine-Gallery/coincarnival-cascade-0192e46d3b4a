import { backend } from "declarations/backend";

class CoinPusherGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = 0;
        this.coins = [];
        this.platform = [];
        this.pegs = [];
        this.gravity = 0.5;
        this.friction = 0.98;
        this.bounceDamping = 0.7;
        this.init();
    }

    async init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.platform = {
            x: 200,
            y: 500,
            width: 400,
            height: 20,
            speed: 0.5,
            direction: 1
        };
        
        // Initialize plinko pegs
        this.initializePegs();

        try {
            this.highScore = await backend.getHighScore();
            document.getElementById('highScore').textContent = this.highScore;
        } catch (e) {
            console.error("Error loading high score:", e);
        }

        document.getElementById('dropCoin').addEventListener('click', () => this.dropCoin());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        
        this.gameLoop();
    }

    initializePegs() {
        const pegSpacing = 40;
        const startY = 150;
        const rows = 8;
        
        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 5;
            const rowWidth = pegsInRow * pegSpacing;
            const startX = (this.canvas.width - rowWidth) / 2;
            
            for (let i = 0; i < pegsInRow; i++) {
                this.pegs.push({
                    x: startX + i * pegSpacing,
                    y: startY + row * pegSpacing,
                    radius: 5
                });
            }
        }
    }

    dropCoin() {
        const coin = {
            x: this.canvas.width / 2,
            y: 50,
            radius: 10,
            velocityX: 0,
            velocityY: 0,
            active: true
        };
        this.coins.push(coin);
    }

    async updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('highScore').textContent = this.highScore;
            try {
                await backend.updateHighScore(this.highScore);
            } catch (e) {
                console.error("Error updating high score:", e);
            }
        }
    }

    async resetGame() {
        this.coins = [];
        this.score = 0;
        document.getElementById('score').textContent = '0';
        try {
            await backend.resetGame();
            this.highScore = await backend.getHighScore();
            document.getElementById('highScore').textContent = this.highScore;
        } catch (e) {
            console.error("Error resetting game:", e);
        }
    }

    checkPegCollision(coin, peg) {
        const dx = coin.x - peg.x;
        const dy = coin.y - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < coin.radius + peg.radius) {
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(coin.velocityX * coin.velocityX + coin.velocityY * coin.velocityY);
            
            coin.x = peg.x + (coin.radius + peg.radius) * Math.cos(angle);
            coin.y = peg.y + (coin.radius + peg.radius) * Math.sin(angle);
            
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            const dotProduct = coin.velocityX * normalX + coin.velocityY * normalY;
            
            coin.velocityX = (coin.velocityX - 2 * dotProduct * normalX) * this.bounceDamping;
            coin.velocityY = (coin.velocityY - 2 * dotProduct * normalY) * this.bounceDamping;
            
            // Add some randomness to make it more interesting
            coin.velocityX += (Math.random() - 0.5) * 0.5;
            return true;
        }
        return false;
    }

    update() {
        // Move platform
        this.platform.x += this.platform.speed * this.platform.direction;
        if (this.platform.x <= 100 || this.platform.x + this.platform.width >= this.canvas.width - 100) {
            this.platform.direction *= -1;
        }

        // Update coins
        for (let coin of this.coins) {
            if (!coin.active) continue;

            coin.velocityY += this.gravity;
            
            // Check collisions with pegs
            let hasCollided = false;
            for (let peg of this.pegs) {
                if (this.checkPegCollision(coin, peg)) {
                    hasCollided = true;
                }
            }

            coin.x += coin.velocityX;
            coin.y += coin.velocityY;

            // Platform collision
            if (coin.y + coin.radius > this.platform.y && 
                coin.y - coin.radius < this.platform.y + this.platform.height &&
                coin.x + coin.radius > this.platform.x && 
                coin.x - coin.radius < this.platform.x + this.platform.width) {
                coin.y = this.platform.y - coin.radius;
                coin.velocityY *= -0.5;
                coin.velocityX += this.platform.speed * this.platform.direction;
            }

            // Wall collisions
            if (coin.x - coin.radius < 0) {
                coin.x = coin.radius;
                coin.velocityX *= -0.5;
            } else if (coin.x + coin.radius > this.canvas.width) {
                coin.x = this.canvas.width - coin.radius;
                coin.velocityX *= -0.5;
            }

            // Bottom collision (coin falls off)
            if (coin.y > this.canvas.height + coin.radius && coin.active) {
                coin.active = false;
                this.updateScore(10);
            }

            // Apply friction
            coin.velocityX *= this.friction;
        }

        // Clean up inactive coins
        this.coins = this.coins.filter(coin => coin.active);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pegs
        this.ctx.fillStyle = '#888';
        for (let peg of this.pegs) {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }

        // Draw platform
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(this.platform.x, this.platform.y, this.platform.width, this.platform.height);

        // Draw coins
        this.ctx.fillStyle = '#FFD700';
        for (let coin of this.coins) {
            this.ctx.beginPath();
            this.ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new CoinPusherGame();
};
