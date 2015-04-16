var startingAmmo : int = 100;
var maxAmmo : int = 100;

private var currentAmmo : int;

function Awake() {
	currentAmmo = startingAmmo;
}

function ResetAmmo() {
	currentAmmo = startingAmmo;
}

function AddAmmo(amount : int) {
	currentAmmo += amount;
	if (currentAmmo > maxAmmo)
		currentAmmo = maxAmmo;
}

function DecrementAmmo() {
	currentAmmo--;
	if (currentAmmo < 0)
		currentAmmo = 0;
}

function HasAmmo() : boolean {
	if (currentAmmo > 0)
		return true;
	else
		return false;
}

function GetAmmoCount() : int {
	return currentAmmo;
}