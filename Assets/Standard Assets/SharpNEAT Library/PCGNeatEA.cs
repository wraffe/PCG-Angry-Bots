using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Xml;
using System.Text;

using SharpNeat.Core;
using SharpNeat.Decoders;
using SharpNeat.Decoders.Neat;
using SharpNeat.DistanceMetrics;
using SharpNeat.EvolutionAlgorithms;
using SharpNeat.EvolutionAlgorithms.ComplexityRegulation;
using SharpNeat.Genomes.HyperNeat;
using SharpNeat.Genomes.Neat;
using SharpNeat.Network;
using SharpNeat.Phenomes;
using SharpNeat.Phenomes.NeuralNets;
using SharpNeat.SpeciationStrategies;
using SharpNeat.Domains;

/*** Acts as a wrapper to the SharpNEAT library to allow easy interfacing from javascript ***/
/*** This setup can either be used when there is one global ContentEA and one global GeometryEA
 * or where there is a local ContentEA for each Geometry candidate.
 * Not to be used where each ContentEA candidate is paired with a GeometryEA candidate to make a single candidate with two genomes ***/ 
public class PCGNeatEA {
	public NeatEvolutionAlgorithm<NeatGenome> contentEA; 
	public INeatExperiment experiment;
	
	public PCGNeatEA() {
		contentEA = null;
	}
	
	public void Initialize() {
 		/*** Initialize experiment ***/
        experiment = new PCGNeatExperiment() as INeatExperiment;
        // Null because not reading settings from xmlFile
        experiment.Initialize("PCG Conetent EA",null); 

        /*** Randomly generate population ***/
        // Set initial settings
        // ? means it is nullable
        int? popSize = experiment.DefaultPopulationSize;

        // Create a genome factory appropriate for the experiment.
        IGenomeFactory<NeatGenome> genomeFactory = experiment.CreateGenomeFactory();

        // Create an initial population of randomly generated genomes.
        // 0u is a struct for a 32 bit unsigned integer
        List<NeatGenome> genomeList = genomeFactory.CreateGenomeList(popSize.Value, 0u);

        // Check number of species is <= the number of the genomes.
        if (genomeList.Count < experiment.NeatEvolutionAlgorithmParameters.SpecieCount)
        {
            Debug.Log("Genome count must be >= specie count. Genomes=" + genomeList.Count 
                + "  Species=" + experiment.NeatEvolutionAlgorithmParameters.SpecieCount);                                  
            return;
        }

        /*** Create the algorithm interface ***/
        contentEA = experiment.CreateEvolutionAlgorithm(genomeFactory, genomeList);
	}
	
	// Initialize with pre-existing xml data
	public void Initialize(string xmlData) {
		/*** Initialize experiment ***/
        experiment = new PCGNeatExperiment() as INeatExperiment;
        // Null because not reading settings from xmlFile
        experiment.Initialize("PCG Conetent EA",null);
		
		/*** Load population of genomes from xml string ***/
        List<NeatGenome> genomeList;
        using(XmlReader xr = XmlReader.Create(new StringReader(xmlData))) 
        {
            genomeList = experiment.LoadPopulation(xr);
        }

        if(genomeList.Count == 0) {
            Debug.LogError("No genomes loaded from XML data from network. Check data is being read correctly.");
            return;
        }
		else
			Debug.Log("Loaded " + genomeList.Count + " Genomes");
		
		/*** Create the algorithm interface ***/
        contentEA = experiment.CreateEvolutionAlgorithm(genomeList[0].GenomeFactory, genomeList);
	}
	
	public string GenomeListToXmlString() {
		// Save genomes to xml file.
		XmlWriterSettings xwSettings = new XmlWriterSettings();
        xwSettings.Indent = true;
		StringBuilder sBuilder = new StringBuilder();
        using(XmlWriter xw = XmlWriter.Create(sBuilder, xwSettings))
        {
            experiment.SavePopulation(xw, contentEA.GenomeList);
        }	
		
		return sBuilder.ToString();
	}
	
	public void RunEA(List<PCGNeatNodeData> geometryData, PCGWekaClassifier updatedPlayerModel) {
		//yield return new WaitForSeconds(0.5f);
		if (contentEA == null)
			Debug.LogError("Content EA not initialized");
		else {
			((PCGNeatExperiment)(experiment)).geomNodeList = geometryData;
			((PCGNeatExperiment)(experiment)).playerModel = updatedPlayerModel;
			contentEA.StartContinue();
		}
	}	
	
	public double[] GetChampOutput(int nodeDepth, int nodeSiblingNum, int maxDepth, int maxBranching) {
		IGenomeDecoder<NeatGenome, IBlackBox> decoder = experiment.CreateGenomeDecoder();
		IBlackBox box = decoder.Decode(contentEA.CurrentChampGenome);
		
		// Normalize nodeDepth and nodeSiblingNum to range of 0-1. This may affect outputs?
		double normDepth = (double)nodeDepth/(double)maxDepth;
		double normSib;
		if (nodeDepth == 0)
			normSib = 0; // Only one node at depth 0, prevent a divide by 0 error
		else
			normSib = (double)nodeSiblingNum/(double)(Mathf.Pow(maxBranching,nodeDepth)-1);
		
		box.InputSignalArray[0] = normDepth;
		box.InputSignalArray[1] = normSib;
		
		box.ResetState();
		box.Activate();
		
		//Debug.Log("(" + normDepth + "," + normSib + ") -> (" + box.OutputSignalArray[0] + "," + box.OutputSignalArray[1] + "," + box.OutputSignalArray[2] + ","
                        //+ box.OutputSignalArray[3] + "," + box.OutputSignalArray[4] + "," + box.OutputSignalArray[5] + ")");
		double[] outputs = new double[box.OutputCount];
		for (int i = 0; i < box.OutputCount; i++) {
			outputs[i] = box.OutputSignalArray[i];
		}
		
		return outputs;		
	}	
	
	
	public void PrintStats() {
		// MUST BE CALLED AFTER RunEA
		NeatAlgorithmStats stats = contentEA.Statistics;
		Debug.Log("************* NEAT STATS **************");
        Debug.Log("Generation = " + stats._generation + ", Total Evaluation = " + stats._totalEvaluationCount 
			+ ", Max Fitness = " + stats._maxFitness + ", MeanFitness = " + stats._meanFitness);		
		
		IGenomeDecoder<NeatGenome, IBlackBox> decoder = experiment.CreateGenomeDecoder();
		IBlackBox box = decoder.Decode(contentEA.CurrentChampGenome);			
		FastAcyclicNetwork concrete = (FastAcyclicNetwork)box;
		
		Debug.Log("Champ:Num hidden nodes = " + concrete.hiddenNodeCount + ", num connections = " + concrete.connectionCount);
		
		// Get highlevel features
		PCGSharpHighLevelFeatures featureCounts = new PCGSharpHighLevelFeatures();
		PCGSharpHighLevelFeatures.C_HL_ROOMTYPE lastRoomType = PCGSharpHighLevelFeatures.C_HL_ROOMTYPE.NoPreviousRoom;
		for (int i = 0; i < (experiment as PCGNeatExperiment).geomNodeList.Count; i++) {
			// Get cppn output for each node
			box.InputSignalArray[0] = (experiment as PCGNeatExperiment).geomNodeList[i].normDepth;
			box.InputSignalArray[1] = (experiment as PCGNeatExperiment).geomNodeList[i].normSiblingIndex;
			
			box.ResetState();
			box.Activate();			
			
			string outputString = box.OutputSignalArray[0].ToString();
			double[] outputs = new double[box.OutputCount];
			outputs[0] = box.OutputSignalArray[0];
			for (int j = 1; j < box.OutputCount; j++) {
				outputString = outputString +","+box.OutputSignalArray[j];
				outputs[j] = box.OutputSignalArray[j];
			}
			
			Debug.Log("(" + (experiment as PCGNeatExperiment).geomNodeList[i].normDepth + ","
				+ (experiment as PCGNeatExperiment).geomNodeList[i].normSiblingIndex + ") -> (" + outputString + ")");			
			
			// Convert each nodes cppn output into a contentId
			int combinedContentID = featureCounts.CPPNOutputToSettingsId(outputs);
			lastRoomType = featureCounts.UpdateFeatures(combinedContentID, lastRoomType);			
		}
			
		// Pass the highlevel features into the player model to get the fitness
		if ((experiment as PCGNeatExperiment).playerModel != null) {
			double[] distributions = (experiment as PCGNeatExperiment).playerModel.ClassifyNewData(featureCounts.ToDoubleArray());
			Debug.Log("Classifier: Champ Distributions: Dislike = " + distributions[0] + ", Like = " + distributions[1]);
			(experiment as PCGNeatExperiment).playerModel.PrintClassifierTestReport();
		}
		
		Debug.Log("**************END NEAT STATS**************");
	}

	
	public bool IsInitialized() {
		if (contentEA == null)
			return false;
		
		return true;
	}
	
	
	public void TestSharpHighLevelFeatures() {
		IGenomeDecoder<NeatGenome, IBlackBox> decoder = experiment.CreateGenomeDecoder();
		IBlackBox box = decoder.Decode(contentEA.CurrentChampGenome);
		
		PCGSharpHighLevelFeatures featureCounts = new PCGSharpHighLevelFeatures();
		for (int i = 0; i < ((PCGNeatExperiment)experiment).geomNodeList.Count; i++) {			
			// Get cppn output for each node
			PCGNeatNodeData currentNode = ((PCGNeatExperiment)experiment).geomNodeList[i];
			box.InputSignalArray[0] = currentNode.normDepth;
			box.InputSignalArray[1] = currentNode.normSiblingIndex;
			
			box.ResetState();			
			box.Activate();			
			
			double[] outputs = new double[box.OutputCount];
			for (int j = 0; j < box.OutputCount; j++) {
				outputs[j] = box.OutputSignalArray[j];
			}
			
			// Convert each nodes cppn output into a contentId
			int combinedContentID = featureCounts.CPPNOutputToSettingsId(outputs);
			
			// Get high level features from contentID and lastRoomType
			PCGSharpHighLevelFeatures.C_HL_ROOMTYPE lastRoomType = PCGSharpHighLevelFeatures.C_HL_ROOMTYPE.NoPreviousRoom;
			if (i>0) // Only the first room should hav NoPreviousRomm
				lastRoomType = currentNode.parentNode.roomType;
			currentNode.roomType = featureCounts.UpdateFeatures(combinedContentID, lastRoomType);			
		}
		
		featureCounts.PrintFeatures();
	}
}
