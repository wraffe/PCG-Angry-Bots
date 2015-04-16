#pragma strict

enum ROOM_TEMPLATE_TYPE {Default, Start, Finish, BuzzBot, SpiderBot, Mech, Health, Ammo, Weapon, Puzzle}; 
enum ROOM_TEMPLATE_DIFFICULTY {Default, Easy, Medium, Hard};
var roomType : ROOM_TEMPLATE_TYPE;
var roomDifficulty : ROOM_TEMPLATE_DIFFICULTY;

var numberOfDoors : int;
