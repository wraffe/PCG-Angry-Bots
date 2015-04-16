using UnityEngine;
using System.Collections;

public class PCGSharpHighLevelFeatures {
	public enum C_HL_ROOMTYPE {NoPreviousRoom, LowELowP, LowEHighP, HighELowP, HighEHighP}
	public enum C_FEATURES {Spider, Buzz, Mech, Health, Ammo, Weapon}
	public enum C_SETTINGS {None, Low, Med, High}
	
	// Direct structure
	int numTotalNodes;
	
	// Direct Content
	int spiderEnumSum;
	int buzzEnumSum;
	int mechEnumSum;
	int healthEnumSum;
	int ammoEnumSum;
	int weaponEnumSum;
	
	// Content combinations (e.g. "low" if {(spider+buzz+mech) < (high+high+high)/2},
	int LowELowPCount; // Number of rooms with low enemies and low pickups
	int LowEHighPCount;
	int HighELowPCount;
	int HighEHighPCount; 
	 
	// Content pace alt
	//(i.e. "a low enemy room is connected to a high enemy room))
	int LowEToLowECount;
	int LowEToHighECount;
	int HighEToLowECount;
	int HighEToHighECount;
	int LowPToLowPCount;
	int LowPToHighPCount;
	int HighPToLowPCount;
	int HighPToHighPCount;
	
	public PCGSharpHighLevelFeatures() {
		numTotalNodes = 0;
		
		spiderEnumSum = 0;
		buzzEnumSum = 0;
		mechEnumSum = 0;
		healthEnumSum = 0;
		ammoEnumSum = 0;
		weaponEnumSum = 0;
		
		LowELowPCount = 0; 
		LowEHighPCount = 0;
		HighELowPCount = 0;
		HighEHighPCount = 0; 
		 
		LowEToLowECount = 0;
		LowEToHighECount = 0;
		HighEToLowECount = 0;
		HighEToHighECount = 0;
		LowPToLowPCount = 0;
		LowPToHighPCount = 0;
		HighPToLowPCount = 0;
		HighPToHighPCount = 0;		
	}	
	
	public C_HL_ROOMTYPE UpdateFeatures(int combinedContentID, C_HL_ROOMTYPE previousRoomType) {			
		// Structure
		numTotalNodes++;
		
		// Content 
		int numFeatures = System.Enum.GetValues(typeof(C_FEATURES)).Length;
		int numSettings = System.Enum.GetValues(typeof(C_SETTINGS)).Length;
		
		//(THIS IS CONVERTED FROM PCGGenericRoomManager AS C# CANT CALL Javascript STUFF BECAUSE Javascript is already calling C#		
		C_SETTINGS[] featureSettings = new C_SETTINGS[numFeatures];
		for (int i = 0; i < numFeatures; i++) {
			float denominator = Mathf.Pow(numSettings,(numFeatures-(i+1)));
			int settingVal = Mathf.FloorToInt(combinedContentID/denominator);
			featureSettings[i] = (C_SETTINGS)settingVal;
			if (settingVal != 0)
				combinedContentID = (int)(combinedContentID % denominator);	
		}
		spiderEnumSum = spiderEnumSum + (int)(featureSettings[(int)C_FEATURES.Spider]);
		buzzEnumSum = buzzEnumSum + (int)featureSettings[(int)C_FEATURES.Buzz];
		mechEnumSum = mechEnumSum + (int)featureSettings[(int)C_FEATURES.Mech];
		healthEnumSum = healthEnumSum + (int)featureSettings[(int)C_FEATURES.Health];
		ammoEnumSum = ammoEnumSum + (int)featureSettings[(int)C_FEATURES.Ammo];
		weaponEnumSum = weaponEnumSum + (int)featureSettings[(int)C_FEATURES.Weapon];
		
		// Room Type
		float numE = (int)(featureSettings[(int)C_FEATURES.Spider]) + (int)(featureSettings[(int)C_FEATURES.Buzz]) + (int)(featureSettings[(int)C_FEATURES.Mech]);
		float numP = (int)(featureSettings[(int)C_FEATURES.Health]) + (int)(featureSettings[(int)C_FEATURES.Ammo]) + (int)(featureSettings[(int)C_FEATURES.Weapon]);
		float avgSetting  = ((float)(C_SETTINGS.High)*3) / 2.0f;
		C_HL_ROOMTYPE roomType = C_HL_ROOMTYPE.LowELowP;
		if ((numE < avgSetting) && (numP < avgSetting)) { 
			roomType = C_HL_ROOMTYPE.LowELowP;	
			LowELowPCount++;		
			if (previousRoomType == C_HL_ROOMTYPE.LowELowP) {
				LowEToLowECount++;
				LowPToLowPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.LowEHighP) {
				LowEToLowECount++;
				HighPToLowPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.HighELowP) {
				HighEToLowECount++;
				LowPToLowPCount++;		
			} else if (previousRoomType == C_HL_ROOMTYPE.HighEHighP) {
				HighEToLowECount++;
				HighPToLowPCount++;			
			}
		} else if ((numE < avgSetting) && (numP >= avgSetting)) { 
			roomType = C_HL_ROOMTYPE.LowEHighP;
			LowEHighPCount++;
			if (previousRoomType == C_HL_ROOMTYPE.LowELowP) {
				LowEToLowECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.LowEHighP) {
				LowEToLowECount++;
				HighPToHighPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.HighELowP) {
				HighEToLowECount++;
				LowPToHighPCount++;		
			} else if (previousRoomType == C_HL_ROOMTYPE.HighEHighP) {
				HighEToLowECount++;
				HighPToHighPCount++;			
			}
		} else if ((numE >= avgSetting) && (numP < avgSetting)) { 
			roomType = C_HL_ROOMTYPE.HighELowP;
			HighELowPCount++;
			if (previousRoomType == C_HL_ROOMTYPE.LowELowP) {
				LowEToHighECount++;
				LowPToLowPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.LowEHighP) {
				LowEToHighECount++;
				HighPToLowPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.HighELowP) {
				HighEToHighECount++;
				LowPToLowPCount++;		
			} else if (previousRoomType == C_HL_ROOMTYPE.HighEHighP) {
				HighEToHighECount++;
				HighPToLowPCount++;			
			}
		} else if ((numE >= avgSetting) && (numP >= avgSetting)) { 
			roomType = C_HL_ROOMTYPE.HighEHighP;
			HighEHighPCount++;
			if (previousRoomType == C_HL_ROOMTYPE.LowELowP) {
				LowEToHighECount++;
				LowPToHighPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.LowEHighP) {
				LowEToHighECount++;
				HighPToHighPCount++;
			} else if (previousRoomType == C_HL_ROOMTYPE.HighELowP) {
				HighEToHighECount++;
				LowPToHighPCount++;		
			} else if (previousRoomType == C_HL_ROOMTYPE.HighEHighP) {
				HighEToHighECount++;
				HighPToHighPCount++;			
			}
		}
		
		return roomType;
	}
	
	public string GetFeatureString() {		
		string word = "";
		word = ((double)spiderEnumSum/(double)numTotalNodes) + "," + ((double)buzzEnumSum/(double)numTotalNodes) + "," + ((double)mechEnumSum/(double)numTotalNodes) + "," + ((double)healthEnumSum/(double)numTotalNodes) + "," + ((double)ammoEnumSum/(double)numTotalNodes) + "," +	((double)weaponEnumSum/(double)numTotalNodes)
				+ "," + ((double)LowELowPCount/(double)numTotalNodes) + "," + ((double)LowEHighPCount/(double)numTotalNodes) + "," + ((double)HighELowPCount/(double)numTotalNodes) + "," + ((double)HighEHighPCount/(double)numTotalNodes) 
				+ "," + ((double)LowEToLowECount/((double)numTotalNodes-1)) + "," + ((double)LowEToHighECount/((double)numTotalNodes-1)) + "," + ((double)HighEToLowECount/((double)numTotalNodes-1)) + "," + ((double)HighEToHighECount/((double)numTotalNodes-1)) 
				+ "," + ((double)LowPToLowPCount/((double)numTotalNodes-1)) + "," + ((double)LowPToHighPCount/((double)numTotalNodes-1)) + "," + ((double)HighPToLowPCount/((double)numTotalNodes-1)) + "," + ((double)HighPToHighPCount/((double)numTotalNodes-1));
				
		return word;
	}
	
	public void PrintFeatures() {
		string word = "";
		word = word + "numTotalNodes=" + numTotalNodes 
				+ ", spiderEnumSum=" + spiderEnumSum + ", buzzEnumSum=" + buzzEnumSum + ", mechEnumSum=" + mechEnumSum + ", healthEnumSum=" + healthEnumSum + ", ammoEnumSum=" + ammoEnumSum + ", weaponEnumSum" + weaponEnumSum
				+ ", LowELowPCount=" + LowELowPCount + ", LowEHighPCount=" + LowEHighPCount + ", HighELowPCount=" + HighELowPCount + ", HighEHighPCount=" + HighEHighPCount 
				+ ", LowEToLowECount=" + LowEToLowECount + ", LowEToHighECount=" + LowEToHighECount + ", HighEToLowECount=" + HighEToLowECount + ", HighEToHighECount=" + HighEToHighECount 
				+ ", LowPToLowPCount=" + LowPToLowPCount + ", LowPToHighPCount=" + LowPToHighPCount + ", HighPToLowPCount=" + HighPToLowPCount + ", HighPToHighPCount=" + HighPToHighPCount;
				
		Debug.Log(word);
	}
	
	public double[] ToDoubleArray() {
		double[] data = new double[18];
		data[0] = ((double)spiderEnumSum/(double)numTotalNodes);
		data[1] =((double)buzzEnumSum/(double)numTotalNodes);
		data[2] =((double)mechEnumSum/(double)numTotalNodes);
		data[3] =((double)healthEnumSum/(double)numTotalNodes);
		data[4] =((double)ammoEnumSum/(double)numTotalNodes); 
		data[5] =((double)weaponEnumSum/(double)numTotalNodes);
		data[6] =((double)LowELowPCount/(double)numTotalNodes);
		data[7] =((double)LowEHighPCount/(double)numTotalNodes);				
		data[8] =((double)HighELowPCount/(double)numTotalNodes);
		data[9] =((double)HighEHighPCount/(double)numTotalNodes);
		data[10] =((double)LowEToLowECount/((double)numTotalNodes-1));
		data[11] =((double)LowEToHighECount/((double)numTotalNodes-1));
		data[12] =((double)HighEToLowECount/((double)numTotalNodes-1));
		data[13] =((double)HighEToHighECount/((double)numTotalNodes-1)); 
		data[14] =((double)LowPToLowPCount/((double)numTotalNodes-1));
		data[15] =((double)LowPToHighPCount/((double)numTotalNodes-1));
		data[16] =((double)HighPToLowPCount/((double)numTotalNodes-1));
		data[17] =((double)HighPToHighPCount/((double)numTotalNodes-1));
		
		return data;		
	}
	
	// Represent difference with negative number. More negative = more different
	public double CompareToOther(PCGSharpHighLevelFeatures other) {
		double[] data1 = ToDoubleArray();
		double[] data2 = other.ToDoubleArray();
		
		double difference = 0;
		for (int i = 0; i < data1.Length; i++) {			
			if (data1[i] >=	data2[i])
				difference -= (data1[i]-data2[i]);
			else
				difference -= (data2[i]-data1[i]);				
		}
		return difference;
	}
	
	/* AGAIN, A C# COPY OF PCGGenericRoomManager, USED BY THE SharpNEAT EVALUATOR */
	public int CPPNOutputToSettingsId(double [] output) {
		int numFeatures = System.Enum.GetValues(typeof(C_FEATURES)).Length;
		int numSettings = System.Enum.GetValues(typeof(C_SETTINGS)).Length;
		
		int settingsID = 0;
		// 2 Because output range is from -1 to 1
		float conversionRange;
		conversionRange = (2.0f/numSettings);
		
		for (int i = 0; i < numFeatures; i++) {
			// I think the output is between 0 and 1 but double check
			if (output[i] < -1 || output[i] > 1)
				Debug.LogError("CPPN Output is out of expected bounds");
			
			// Figure out which setting the output corresponds to 
			int thisSetting = 0;
			for (int j = -(numSettings/2); j < (numSettings/2); j++) {
				float lower = j*conversionRange;
				float upper = lower + conversionRange;	
				if (upper == 1) // To detect last case
					upper = 1.1f;
				if (output[i] >= lower && output[i] < upper) {
					thisSetting = j+(numSettings/2);
					//Debug.LogError("FeatureCollector: Feature-" + i + ": CPPN Output = " + output[i] + ", thisSetting = " + thisSetting);
					break;
				}
			}
			
			settingsID = settingsID + (int)(thisSetting * Mathf.Pow(numSettings,(numFeatures-(i+1))));
		}
		
		return settingsID;
	}
}
