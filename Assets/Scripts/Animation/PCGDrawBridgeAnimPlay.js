var puzzle : PCGPuzzle;

private var wasLocked = true;

function Awake () {
	animation.wrapMode = WrapMode.Once;
	animation.clip.wrapMode = WrapMode.Once;
	if (puzzle == null)
		animation.Play();		
}
// When the door is unlocked, play the animation
function Update () {
	if (puzzle != null) {
		if (!puzzle.locked && wasLocked){
			animation.Play();
			wasLocked = false;
		}
	}
}