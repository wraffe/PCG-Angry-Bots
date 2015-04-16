using System;
using System.IO;
using System.Collections;
using System.Linq;
using System.Text;
using UnityEngine;

public class wekaDuplicateFilter : MonoBehaviour {
    public static weka.core.Instances allUniqueData;
	public static int totalInstances, dupInstances, dupInstancesSamePlayer;
	
	IEnumerator Start() 
    {	
		totalInstances = 0; dupInstances = 0; dupInstancesSamePlayer = 0;
		StreamReader userIDFile = new StreamReader("..\\Matlab Analysis\\all_IDs.txt");		
		while(userIDFile.Peek() >= 0)
		{
			String userID = userIDFile.ReadLine();
			Debug.Log("Played ID: " + userID);
			String data = File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\"+userID+"\\"+userID+"-FeatureData.arff");
			classifyTest(data, userID);
			yield return 0; yield return 0;
		}
		
		Debug.Log("Duplicate Instances: " + dupInstances);
		Debug.Log("Duplicate Instances that were for the same player: " + dupInstancesSamePlayer);
    }
	
	// Test the classification result of each map that a user played, 
	// with the data available as if they were playing through it
	public static void classifyTest(String dataString, String playerID) {
		try {
			java.io.StringReader stringReader = new java.io.StringReader(dataString);
			java.io.BufferedReader buffReader = new java.io.BufferedReader(stringReader);			
			
			/* NOTE THAT FOR NAIVE BAYES ALL WEIGHTS CAN BE = 1*/
        	//weka.core.converters.ConverterUtils.DataSource source = new weka.core.converters.ConverterUtils.DataSource("iris.arff");
			weka.core.Instances thisData = new weka.core.Instances(buffReader); //source.getDataSet();
			if (thisData.classIndex() == -1)
				thisData.setClassIndex(thisData.numAttributes() - 1);
			
			weka.core.Instances thisUniqueData = new weka.core.Instances(thisData);
			if (thisUniqueData.classIndex() == -1)
				thisUniqueData.setClassIndex(thisUniqueData.numAttributes() - 1);
			thisUniqueData.delete();
			
			if (allUniqueData == null) {
				allUniqueData = new weka.core.Instances(thisData);
				if (allUniqueData.classIndex() == -1)
					allUniqueData.setClassIndex(allUniqueData.numAttributes() - 1);
				allUniqueData.delete();				
			}			
			
			weka.core.InstanceComparator com = new weka.core.InstanceComparator(false);			
			
			for (int i = 0; i < thisData.numInstances(); i++) 
			{
				bool dup = false;
				for (int j = 0; j < allUniqueData.numInstances(); j++)
				{
					if (com.compare(thisData.instance(i),allUniqueData.instance(j)) == 0)
					{
						Debug.Log("Duplicate found!");
						dup = true;
						break;
					}
				}			
				if (!dup)
					allUniqueData.add(thisData.instance(i));
				else 
					dupInstances++;
			}
			
			for (int i = 0; i < thisData.numInstances(); i++) 
			{
				bool dup = false;
				for (int j = 0; j < thisUniqueData.numInstances(); j++)
				{
					if (com.compare(thisData.instance(i),thisUniqueData.instance(j)) == 0)
					{
						Debug.Log("Duplicate found!");
						dup = true;
						break;
					}
				}			
				if (!dup)
					thisUniqueData.add(thisData.instance(i));
				else 
					dupInstancesSamePlayer++;
			}
			
			
			//Debug.Log("All Data Instance Count = " + thisData.numInstances());
			//Debug.Log("Unique Data Instance Count = " + thisUniqueData.numInstances());
			//Debug.Log("Done!");
			
		} catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
	}
}
