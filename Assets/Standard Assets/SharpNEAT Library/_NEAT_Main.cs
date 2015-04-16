using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

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

public class _NEAT_Main : MonoBehaviour {
	NeatEvolutionAlgorithm<NeatGenome> ea;

	// Use this for initialization
	IEnumerator Start () {
		 /*** Initialize experiment ***/
            INeatExperiment experiment = new TestExperiment() as INeatExperiment;
            // Null because not reading settings from xmlFile
            experiment.Initialize("this is a test",null); 


            /*** Randomly generate population ***/
            // Set initial settings
            // ? means it is nullable
            int? popSize = experiment.DefaultPopulationSize;
            //double? initConnProportion = experiment.NeatGenomeParameters.InitialInterconnectionsProportion;

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
                return false;
            }


            /*** Run the algorithm ***/
            ea = experiment.CreateEvolutionAlgorithm(genomeFactory, genomeList);
			//for (int j = 0; j < 100; j++) {
				yield return new WaitForSeconds(0.5f);
				//Debug.Log(j);
            	ea.StartContinue();
				NeatAlgorithmStats stats = ea.Statistics;
             	Debug.Log(stats._generation+", "+stats._maxFitness+", "+stats._meanFitness+", "+stats._totalEvaluationCount+", "+stats._maxComplexity);
			//}
		
			//NeatAlgorithmStats stats = ea.Statistics;
            //Debug.Log(stats._generation+", "+stats._maxFitness+", "+stats._meanFitness+", "+stats._totalEvaluationCount+", "+stats._maxComplexity);
			
			IGenomeDecoder<NeatGenome, IBlackBox> decoder = experiment.CreateGenomeDecoder();
			IBlackBox box = decoder.Decode(ea.CurrentChampGenome);
			FastAcyclicNetwork concrete = (FastAcyclicNetwork)box;
			Debug.Log("Num hidden nodes = " + concrete.hiddenNodeCount + ", num connections = " + concrete.connectionCount);
			
			box.InputSignalArray[0] = 0;
			box.InputSignalArray[1] = 0;
		
			box.Activate();
		
			for (int i = 0; i < box.OutputCount; i++) {
				Debug.LogWarning("Output["+i+"] = " + box.OutputSignalArray[i]);	
		}
			
	}
	
	IEnumerator RunEvolution() {
		ea.StartContinue();
		yield return new WaitForSeconds(1);
	}
}
