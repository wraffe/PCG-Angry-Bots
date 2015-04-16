#pragma strict

class PCGLinearGene {
	var inDoor : int;
	var roomID : int;
	var outDoor : int;
	var corridorID : int;
	
	function PCGLinearGene(inboundDoor : int, roomTemplateID : int, 
							outboundDoor : int, corridorTemplateID : int) {
		inDoor = inboundDoor;
		roomID = roomTemplateID;
		outDoor = outboundDoor;
		corridorID = corridorTemplateID;	
	}
	
	function PCGLinearGene(otherGene : PCGLinearGene) {
		this.inDoor = otherGene.inDoor;
		this.roomID = otherGene.roomID ;
		this.outDoor = otherGene.outDoor;
		this.corridorID = otherGene.corridorID;
	}
}