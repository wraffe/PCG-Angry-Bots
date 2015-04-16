using System;
using System.IO;
using System.Collections;
using System.Linq;
using System.Text;
using UnityEngine;

// From http://weka.wikispaces.com/Use+Weka+in+your+Java+code
// and http://weka.wikispaces.com/IKVM+with+Weka+tutorial
class WekaTest : MonoBehaviour
{
	IEnumerator Start() 
    {		
		StreamReader userIDFile = new StreamReader("..\\Matlab Analysis\\all_IDs.txt");		
		while(userIDFile.Peek() >= 0)
		{
			String userID = userIDFile.ReadLine();			
			Debug.Log("Played ID: " + userID);
			String data = File.ReadAllText("DataForMatlab\\Unity-UserData_Backup_March\\"+userID+"\\"+userID+"-FeatureData.arff");			
			classifyTest(data, userID);
			yield return 0; yield return 0;
		}
    }
	
	// Test the classification result of each map that a user played, 
	// with the data available as if they were playing through it
	public static void classifyTest(String dataString, String playerID) {
		// Get the initial data (the headers and the first instance)
		String [] split = dataString.Split('\n');
		// 19 attribute lines, 2 header lines, 1 instance line
		String initData = "";
		for (int i = 0; i < 22; i++) 
			initData = initData+ split[i] + '\n';		
		
		PCGWekaClassifier classifier = new PCGWekaClassifier();				
		classifier.InitializeClassifier(initData);
		
		// Loop through the res of the data, classifiying new instance and then
		// updating the classifier. -1 because the last line i believe is blank
		String predictions = "";
		String actuals = "";
		for (int i = 22; i < split.Length; i++) {
			if (split[i].Equals(""))
				break;
			double[] newData = instanceStringToDoubleArray(split[i]);
			double[] results = classifier.ClassifyNewData(newData);			
			
			int finalResult = -1;
			if (results[1] < 0.5)
				finalResult = 0;
			else
				finalResult = 1;
			
			// Random classifier
			/*int min = 0;
			int max = 2;
			finalResult = UnityEngine.Random.Range(min,max);
			*/
			
			String [] lineSplit = split[i].Split(',');
			int userRating = int.Parse(lineSplit[lineSplit.Length-2]);
			
			//Debug.Log("Map = " + (i-20) + ", Dislike = " + results[0] + ", Like = " + results[1] + ", Result = " + finalResult); 	
			
			if (i != 22) {
				predictions = predictions + ", ";
				actuals = actuals + ", ";
			}
			predictions = predictions + finalResult.ToString();
			actuals = actuals + userRating;				
			
			classifier.UpdateClassifierFromInstanceString(split[i]);
		}
		
		// Write values to file for a matlab read
	 	StreamWriter writer = new StreamWriter("DataForMatlab\\"+playerID+"_ModelPredictions_RandomForest.txt");
		writer.WriteLine(predictions);
		writer.WriteLine(actuals);
		writer.Close();
	} 
	
	/*private static String playerID = "7528";
    IEnumerator Start() 
    {
        Debug.Log("Hello Java, from C#!");
		WWWForm form = new WWWForm();
		form.AddField("playerID",playerID);
		WWW download = new WWW("goanna.cs.rmit.edu.au/~wraffe/cgi-bin/Unity-FetchFeatureData.cgi", form);
		yield return download;				
        classifyTest(download.text);
    }
	
	// Test the classification result of each map that a user played, 
	// with the data available as if they were playing through it
	public static void classifyTest(String dataString) {
		// Get the initial data (the headers and the first instance)
		String [] split = dataString.Split('\n');
		// 19 attribute lines, 2 header lines, 1 instance line
		String initData = "";
		for (int i = 0; i < 22; i++) 
			initData = initData+ split[i] + '\n';		
		
		PCGWekaClassifier classifier = new PCGWekaClassifier();				
		classifier.InitializeClassifier(initData);
		
		// Loop through the res of the data, classifiying new instance and then
		// updating the classifier. -1 because the last line i believe is blank
		String predictions = "";
		String actuals = "";
		for (int i = 22; i < split.Length; i++) {
			if (split[i].Equals(""))
				break;
			double[] newData = instanceStringToDoubleArray(split[i]);
			double[] results = classifier.ClassifyNewData(newData);			
			
			int finalResult = -1;
			if (results[1] < 0.5)
				finalResult = 0;
			else
				finalResult = 1;
			
			String [] lineSplit = split[i].Split(',');
			int userRating = int.Parse(lineSplit[lineSplit.Length-2]);
			
			Debug.Log("Map = " + (i-20) + ", Dislike = " + results[0] + ", Like = " + results[1] + ", Result = " + finalResult); 	
			
			if (i != 22) {
				predictions = predictions + ", ";
				actuals = actuals + ", ";
			}
			predictions = predictions + finalResult.ToString();
			actuals = actuals + userRating;				
			
			classifier.UpdateClassifierFromInstanceString(split[i]);
		}
		
		// Write values to file for a matlab read
	 	StreamWriter writer = new StreamWriter("ScreenShots/"+playerID+"_ModelPredictions.txt");
		writer.WriteLine(predictions);
		writer.WriteLine(actuals);
		writer.Close();
	} */
	
	
	// Used to get the data need to classify a new instance (i.e. does not include rating)
	public static double[] instanceStringToDoubleArray(String line) {
		String[] lineSplit = line.Split(',');
		double[] data = new double[lineSplit.Length-2];
		for (int j = 0; j < lineSplit.Length-2; j++) 
			data[j] = double.Parse(lineSplit[j]);
		
		return data;
	}
	
    /*const int percentSplit = 66;
    public static void classifyTest(String dataString)
    {		
        try
        {
			// Can use c# strings directly in java method calls
			// Read entire file into a string (e.g. in PCGAngry_Bots this will be replaced by the string that is returned from the perl server
			// Make a BufferedReader from the string so that it can be passed to Instances constructor
			//String fileName = "iris.arff";
			//java.io.StringReader stringReader = new java.io.StringReader(new java.util.Scanner(new java.io.File(fileName)).useDelimiter("\\Z").next());
			java.io.StringReader stringReader = new java.io.StringReader(dataString);
			java.io.BufferedReader buffReader = new java.io.BufferedReader(stringReader);
			
			
			/* NOTE THAT FOR NAIVE BAYES ALL WEIGHTS CAN BE = 1/
        	//weka.core.converters.ConverterUtils.DataSource source = new weka.core.converters.ConverterUtils.DataSource("iris.arff");
			weka.core.Instances data = new weka.core.Instances(buffReader); //source.getDataSet();
			// setting class attribute if the data format does not provide this information
			// For example, the XRFF format saves the class attribute information as well
			if (data.classIndex() == -1)
				data.setClassIndex(data.numAttributes() - 1);

            weka.classifiers.Classifier cl = new weka.classifiers.bayes.NaiveBayes();
			cl.buildClassifier(data);
			
			Debug.Log("Classifier: Number of instances: " + data.numInstances());
			weka.classifiers.Evaluation eval = new weka.classifiers.Evaluation(data);
	 		eval.crossValidateModel(cl, data, 10, new java.util.Random(1));			
			
			Debug.Log(eval.toSummaryString("\nClassifier: Cross Validate Results: \n======\n", false));
			
			//double [] newData = new double[]{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1};
			//weka.core.Instance newInstance = new weka.core.Instance(0,newData);
			//newInstance.setDataset(data);
			//Debug.Log((cl.distributionForInstance(newInstance))[0]);
            //Debug.Log("Performing " + percentSplit + "% split evaluation.");
			
			//weka.classifiers.Evaluation eval = new weka.classifiers.Evaluation(data);
 			//eval.crossValidateModel(cl, data, 10, new java.util.Random(1));
			
			//Debug.Log(eval.toSummaryString("\nResults\n======\n", false));
			
			//for (int i = 0; i < data.numInstances(); i++)
				//Debug.Log(data.instance(i).weight());
			
            //randomize the order of the instances in the dataset.
            /*weka.filters.Filter myRandom = new weka.filters.unsupervised.instance.Randomize();
            myRandom.setInputFormat(insts);
            insts = weka.filters.Filter.useFilter(insts, myRandom);

            int trainSize = insts.numInstances() * percentSplit / 100;
            int testSize = insts.numInstances() - trainSize;
            weka.core.Instances train = new weka.core.Instances(insts, 0, trainSize);

            cl.buildClassifier(train);
            int numCorrect = 0;
            for (int i = trainSize; i < insts.numInstances(); i++)
            {
                weka.core.Instance currentInst = insts.instance(i);
                double predictedClass = cl.classifyInstance(currentInst);
                if (predictedClass == insts.instance(i).classValue())
                    numCorrect++;
            }
            Debug.Log(numCorrect + " out of " + testSize + " correct (" +
                       (double)((double)numCorrect / (double)testSize * 100.0) + "%)"); /
        }
        catch (java.lang.Exception ex)
        {
            Debug.LogError(ex.getMessage());
        }
    }*/
}

