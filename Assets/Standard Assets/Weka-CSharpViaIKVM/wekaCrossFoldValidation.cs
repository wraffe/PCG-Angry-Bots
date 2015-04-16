using System;
using System.IO;
using System.Collections;
using System.Linq;
using System.Text;
using UnityEngine;

public class wekaCrossFoldValidation : MonoBehaviour {
    
	IEnumerator Start() 
    {		
		StreamReader userIDFile = new StreamReader("..\\Matlab Analysis\\xOrMore_IDs.txt");		
		while(userIDFile.Peek() >= 0)
		{
			String userID = userIDFile.ReadLine();
			String data = File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\"+userID+"\\"+userID+"-FeatureData.arff");
			if (!userID.Equals("4132"))
				classifyTest(data, userID);
			yield return 0; yield return 0;
		}
		
		/*
		String data = File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\default\\default_alt - binaryClass - reducedFeatures.arff");
		classifyTest(data, "default");
		yield return 0; yield return 0;
		*/
    }
	
	// Test the classification result of each map that a user played, 
	// with the data available as if they were playing through it
	public static void classifyTest(String dataString, String playerID) {
		String results = "";
		try {
			java.io.StringReader stringReader = new java.io.StringReader(dataString);
			java.io.BufferedReader buffReader = new java.io.BufferedReader(stringReader);			
			
			/* NOTE THAT FOR NAIVE BAYES ALL WEIGHTS CAN BE = 1*/
        	//weka.core.converters.ConverterUtils.DataSource source = new weka.core.converters.ConverterUtils.DataSource("iris.arff");
			weka.core.Instances data = new weka.core.Instances(buffReader); //source.getDataSet();
			// setting class attribute if the data format does not provide this information
			// For example, the XRFF format saves the class attribute information as well
			if (data.classIndex() == -1)
				data.setClassIndex(data.numAttributes() - 1);

            weka.classifiers.Classifier cl;	
			for (int i = 2; i <= data.numInstances(); i++) {
				//cl = new weka.classifiers.bayes.NaiveBayes();
				//cl = new weka.classifiers.trees.J48();
				//cl = new weka.classifiers.lazy.IB1();
				cl = new weka.classifiers.functions.MultilayerPerceptron();
				((weka.classifiers.functions.MultilayerPerceptron)cl).setHiddenLayers("12");
				//cl = new weka.classifiers.trees.RandomForest();
				
				weka.core.Instances subset = new weka.core.Instances(data,0,i);
				cl.buildClassifier(subset);
				
				weka.classifiers.Evaluation eval = new weka.classifiers.Evaluation(subset);
		 		eval.crossValidateModel(cl, subset, subset.numInstances(), new java.util.Random(1));
				results = results + eval.pctCorrect(); // For accuracy measurement
				/* For Mathews Correlation Coefficient */
				//double TP = eval.numTruePositives(1);
				//double FP = eval.numFalsePositives(1);
				//double TN = eval.numTrueNegatives(1);
				//double FN = eval.numFalseNegatives(1);
				//double correlationCoeff = ((TP*TN)-(FP*FN))/Math.Sqrt((TP+FP)*(TP+FN)*(TN+FP)*(TN+FN));
				//results = results + correlationCoeff; 
				if (i != data.numInstances())
					results = results + ", ";
				if(i == data.numInstances())
					Debug.Log("Player: " + playerID + ", Num Maps: " + data.numInstances() + ", AUC: " + eval.areaUnderROC(1));
			}			
		} catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
		// Write values to file for a matlab read
		// For accuracy
	 	//StreamWriter writer = new StreamWriter("DataForMatlab/"+playerID+"_CrossFoldValidations_RandomForest.txt"); 
		StreamWriter writer = new StreamWriter("DataForMatlab/"+playerID+"_LOOCrossFold_NeuralNet.txt"); 
		
		//StreamWriter writer = new StreamWriter("DataForMatlab/"+playerID+"_CrossFoldCorrCoeff.txt"); // For mathews cc
		writer.WriteLine(results);
		writer.Close();
		Debug.Log(playerID + " has been written to file");
	}
	
	
	// Used to get the data need to classify a new instance (i.e. does not include rating)
	public static double[] instanceStringToDoubleArray(String line) {
		String[] lineSplit = line.Split(',');
		double[] data = new double[lineSplit.Length-2];
		for (int j = 0; j < lineSplit.Length-2; j++) 
			data[j] = double.Parse(lineSplit[j]);
		
		return data;
	}	
}
