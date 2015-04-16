using UnityEngine;
using System.Collections;


// Used as a c# representation of all the data that is needed for SharpNEAT, WEKA, and High Level feature calculator
public class PCGNeatNodeData {
	public PCGNeatNodeData parentNode;
	public double normDepth;
	public double normSiblingIndex;
	public int contentSetting; 
	// Used by SharpHighLevelFeatures
	public PCGSharpHighLevelFeatures.C_HL_ROOMTYPE roomType;
	
	public PCGNeatNodeData(PCGNeatNodeData previousNode, double normTreeDepth, double normTreeTotalSibNum) {
		parentNode = previousNode;
		normDepth = normTreeDepth;
		normSiblingIndex = normTreeTotalSibNum;
	}
	
	public PCGNeatNodeData(PCGNeatNodeData previousNode, double normTreeDepth, double normTreeTotalSibNum, int setting) {
		parentNode = previousNode;
		normDepth = normTreeDepth;
		normSiblingIndex = normTreeTotalSibNum;
		contentSetting = setting;
	}
}
