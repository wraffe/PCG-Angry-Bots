#pragma strict

@HideInInspector
public var genericClass : genericTestSuper;

function Start () {
	genericClass = gameObject.GetComponent(genericTestSub);
	genericClass.ChangeWord();
	genericClass.SubChange();
}
