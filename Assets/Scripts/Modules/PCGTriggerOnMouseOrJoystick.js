#pragma strict
// Modified to listen for second mouse button too

public var primaryMouseDownSignals : SignalSender;
public var primaryMouseUpSignals : SignalSender;
public var secondaryMouseDownSignals : SignalSender;
public var secondaryMouseUpSignals : SignalSender;

private var state : boolean = false;

#if UNITY_IPHONE || UNITY_ANDROID
private var joysticks : Joystick[];

function Start () {
	joysticks = FindObjectsOfType (Joystick) as Joystick[];	
}
#endif

function Update () {
#if UNITY_IPHONE || UNITY_ANDROID
	if (state == false && joysticks[0].tapCount > 0) {
		mouseDownSignals.SendSignals (this);
		state = true;
	}
	else if (joysticks[0].tapCount <= 0) {
		mouseUpSignals.SendSignals (this);
		state = false;
	}	
#else	
	#if !UNITY_EDITOR && (UNITY_XBOX360 || UNITY_PS3)
		// On consoles use the right trigger to fire
		var fireAxis : float = Input.GetAxis("TriggerFire");
		if (state == false && fireAxis >= 0.2) {
			mouseDownSignals.SendSignals (this);
			state = true;
		}
		else if (state == true && fireAxis < 0.2) {
			mouseUpSignals.SendSignals (this);
			state = false;
		}
	#else
		if (Input.GetMouseButtonDown (0)) {
			primaryMouseDownSignals.SendSignals (this);
			state = true;
		}
		
		else if (state == true && Input.GetMouseButtonUp (0)) {
			primaryMouseUpSignals.SendSignals (this);
			state = false;
		}
		
		else if (state == false && Input.GetMouseButtonDown (2)) {
			secondaryMouseDownSignals.SendSignals (this);
			state = true;
		}
		
		else if (state == true && Input.GetMouseButtonUp (2)) {
			secondaryMouseUpSignals.SendSignals (this);
			state = false;
		}
	#endif
#endif
}
