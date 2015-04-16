using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SharpNeat.Core;
using SharpNeat.Phenomes;
using SharpNeat.Phenomes.NeuralNets;

// Only important interface method here is "Evaluate"
class PCGNeatEvaluator : IPhenomeEvaluator<IBlackBox>
{
     #region Instance Fields
	PCGNeatExperiment _experiment;
	
    ulong _evalCount;
    bool _stopConditionSatisfied;

    ulong _evalBlockSize;
    ulong _nextEvalStop;

    public PCGNeatEvaluator(PCGNeatExperiment parentExperiment)
    {
		_experiment = parentExperiment;
        _evalBlockSize = 10000;
        _nextEvalStop = _evalBlockSize;
    }

    #endregion

    #region IPhenomeEvaluator<IBlackBox> Members

    /// <summary>
    /// Gets the total number of evaluations that have been performed.
    /// </summary>
    public ulong EvaluationCount
    {
        get { return _evalCount; }
    }

    /// <summary>
    /// Gets a value indicating whether some goal fitness has been achieved and that
    /// the the evolutionary algorithm/search should stop. This property's value can remain false
    /// to allow the algorithm to run indefinitely.
    /// </summary>
    public bool StopConditionSatisfied
    {
        get { return _stopConditionSatisfied; }
    }

    /// <summary>
    /// Evaluate the provided phenome and return its fitness score. 
    /// This takes a blackbox (pretty much the decoded neuralnetwork (the phenome)) that input can be passed to 
    /// and output processed in the domain. Makes it very easy, we dont have to wory about the genome (genelist) or phenome (network) at all
    /// </summary>
    public FitnessInfo Evaluate(IBlackBox box)
    {   
		// Set a maximum number of evaluations
		_evalCount++;
        double fitness = 0.5;
		FitnessInfo fitnessInfo = new FitnessInfo(fitness, fitness); 

        if (_evalCount > _nextEvalStop)
        {
            _nextEvalStop += _evalBlockSize;
            _stopConditionSatisfied = true;
        }
		
		// Only use player model if it has been initialized. Otherwise, all fitness is 0.5
		if (_experiment.playerModel != null) {
			// Get highlevel features
			PCGSharpHighLevelFeatures featureCounts = new PCGSharpHighLevelFeatures();
			PCGSharpHighLevelFeatures.C_HL_ROOMTYPE lastRoomType = PCGSharpHighLevelFeatures.C_HL_ROOMTYPE.NoPreviousRoom;
			for (int i = 0; i < _experiment.geomNodeList.Count; i++) {
				// Get cppn output for each node
				box.InputSignalArray[0] = _experiment.geomNodeList[i].normDepth;
				box.InputSignalArray[1] = _experiment.geomNodeList[i].normSiblingIndex;
				
				box.ResetState();
				box.Activate();			
				
				double[] outputs = new double[box.OutputCount];
				for (int j = 0; j < box.OutputCount; j++) {
					outputs[j] = box.OutputSignalArray[j];
				}
				
				// Convert each nodes cppn output into a contentId
				int combinedContentID = featureCounts.CPPNOutputToSettingsId(outputs);
				lastRoomType = featureCounts.UpdateFeatures(combinedContentID, lastRoomType);		
			}
			
			// Pass the highlevel features into the player model to get the fitness
			double[] distributions = _experiment.playerModel.ClassifyNewData(featureCounts.ToDoubleArray());
			// Fitness is the membership to the "Like" class (positive class)
			fitnessInfo = new FitnessInfo(distributions[1], distributions[1]);
		}

        return fitnessInfo; 
    }

    /// <summary>
    /// Reset the internal state of the evaluation scheme if any exists.
    /// </summary>
    public void Reset()
    {
		_stopConditionSatisfied = false;
    }

    #endregion
}
