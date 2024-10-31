import Int "mo:base/Int";
import Nat "mo:base/Nat";

actor CoinPusher {
    stable var highScore : Nat = 0;

    // Get the current high score
    public query func getHighScore() : async Nat {
        highScore
    };

    // Update the high score if the new score is higher
    public func updateHighScore(newScore : Nat) : async () {
        if (newScore > highScore) {
            highScore := newScore;
        };
    };

    // Reset the game state
    public func resetGame() : async () {
        // Keep the high score, just reset other game state if needed
    };
}
