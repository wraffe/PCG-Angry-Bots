#pragma strict

class genericTestSuper extends MonoBehaviour {
	var word : String = "unchanged";
	
	function Update () {
		Debug.Log(word);
	}
	
	function ChangeWord() {
		word = "Changed";
	}
	
	function SubChange() {}
}