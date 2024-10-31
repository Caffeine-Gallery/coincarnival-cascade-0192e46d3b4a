import { backend } from "declarations/backend";

class CoinPusherGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = 0;
        this.coins = [];
        this.platform = [];
        this.gravity = 0.5;
        this.friction = 0.98;
        this.init();
    }

    async init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.platform = {
            x: 200,
            y: 400,
            width: 400,
            height: 20,
            speed: 0.5,
            direction: 1
        };
        
        // Load high score from backend
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

    dropCoin() {
        const coin = {
            x: this.canvas.width / 2,
            y: 50,
            radius: 15,
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
            if (coin.x - coin.radius < 0 || coin.x + coin.radius > this.canvas.width) {
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
