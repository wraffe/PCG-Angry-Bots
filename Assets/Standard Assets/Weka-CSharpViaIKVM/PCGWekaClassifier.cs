using UnityEngine;
using System;
using System.Collections;

public class PCGWekaClassifier  {
	private weka.classifiers.Classifier classifier;
	private weka.core.Instances playerData;
	
	public PCGWekaClassifier() {}
	
	
	/* Use when the player logs in to initially create the classifier with data from server */
	public void InitializeClassifier(String dataString) {
		try {
			java.io.StringReader stringReader = new java.io.StringReader(dataString);
			java.io.BufferedReader buffReader = new java.io.BufferedReader(stringReader);	
				
			playerData = new weka.core.Instances(buffReader);
			
			/* State where in each Instance the class attribute is, if its not already specified by the file */
			if (playerData.classIndex() == -1)
				playerData.setClassIndex(playerData.numAttributes() - 1);
			
			/* NAIVE BAYES */
	        //classifier = new weka.classifiers.bayes.NaiveBayes();
			
			/* NEURAL NET */
			//classifier = new weka.classifiers.functions.MultilayerPerceptron();
			//((weka.classifiers.functions.MultilayerPerceptron)classifier).setHiddenLayers("12");
			
			/* J48 TREE */
			//classifier = new weka.classifiers.trees.J48();
			
			/* IB1 NEAREST NEIGHBOUR */
			//classifier = new weka.classifiers.lazy.IB1();
			
			/* RANDOM FOREST */
			classifier = new weka.classifiers.trees.RandomForest();
			
			
			classifier.buildClassifier(playerData);
			Debug.Log("Initialized Classifier");
		}
        catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
	}	
	
	public void UpdateClassifier(double[] newMapData, int lastRating) {
		try 
		{
			// Copy data to a new array and add the rating (the class of this instance)
			double [] fullData = new double[newMapData.Length+1];
			for (int i = 0; i < newMapData.Length; i++)
				fullData[i] = newMapData[i];
			//*********fullData[fullData.Length-1] = (double) lastRating;
			fullData[fullData.Length-1] = (double)((lastRating-1)/3);
			//Debug.LogWarning(fullData[fullData.Length-1]);
			double weight = 0;
			if (lastRating == 1 || lastRating == 6)
				weight = 2;
			else if (lastRating == 2 || lastRating == 5)
				weight = 1;
			else
				weight = 0.5;
			
			// Naive Bayes defaults all data to weight of 1, do same for this instance
			//*******weka.core.Instance newInstance = new weka.core.Instance(1,fullData);
			weka.core.Instance newInstance = new weka.core.Instance(weight,fullData);
			playerData.add(newInstance);
			
			// This version of Naive Bayes is not updateable, so just rebuild the classifier
			// Updateable version has slightly lower accuracy
			classifier.buildClassifier(playerData);
		}
        catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
	}
	
	public void UpdateClassifierFromInstanceString(String line) {
		try {
			String[] lineSplit = line.Split(',');
			double[] fullData = new double[lineSplit.Length-1];
			for (int j = 0; j < lineSplit.Length-1; j++) 
				fullData[j] = double.Parse(lineSplit[j]);
			
			String weightS = lineSplit[lineSplit.Length-1];
			//Debug.Log(weightS);
			weightS = weightS.Remove(weightS.Length-1,1);
			if(weightS[weightS.Length-1] == '}')
				weightS = weightS.Remove(weightS.Length-1,1);
			weightS = weightS.Remove(0,1);
			//Debug.Log(weightS);
			double weight = double.Parse(weightS);
			
			weka.core.Instance newInstance = new weka.core.Instance(weight,fullData);
			playerData.add(newInstance);
			classifier.buildClassifier(playerData);
		}
        catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
	}
	
	
	public double[] ClassifyNewData(double[] newData) {
		weka.core.Instance newInstance = new weka.core.Instance(1,newData);
		newInstance.setDataset(playerData);
		return classifier.distributionForInstance(newInstance);
	}	
	
	public String PrintClassifierTestReport() {
		try {
			Debug.Log("Classifier: Number of instances: " + playerData.numInstances());
			weka.classifiers.Evaluation eval = new weka.classifiers.Evaluation(playerData);
	 		eval.crossValidateModel(classifier, playerData, 10, new java.util.Random(1));			
			
			Debug.Log(eval.toSummaryString("\nClassifier: Cross Validate Results: \n======\n", false));
			return (eval.toSummaryString("\nResults\n======\n", false));
		}
        catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
		return null;
	}
}
