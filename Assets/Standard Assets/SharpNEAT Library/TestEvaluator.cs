using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SharpNeat.Core;
using SharpNeat.Phenomes;
using SharpNeat.Phenomes.NeuralNets;

    // Only important interface method here is "Evaluate"
    class TestEvaluator : IPhenomeEvaluator<IBlackBox>
    {
         #region Instance Fields

        ulong _evalCount;
        bool _stopConditionSatisfied;

        ulong _evalBlockSize;
        ulong _nextEvalStop;

        public TestEvaluator()
        {
            _evalBlockSize = 20000;
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
            // Alternative to promote complexity in hidden layer
            /*** Had to change FastAcyclicNetwork to contain the complexity variable
             * and had to change FastAcyclicNetworkFactory to assign it during genome decoding to blackbox (a FastAcyclicNetwork in this case)
             */
            /* _evalCount++;
            double fitness = 0.0;
            if (_evalCount < 5000)
            {
                FastAcyclicNetwork concrete = (FastAcyclicNetwork)box;
                
                // Searching for a ideally 2 hidden nodes
                fitness = 100 - Math.Abs(2-concrete.hiddenNodeCount);
                if (fitness < 0.0)
                    fitness = 0.0;
            }
            else
                fitness = 1000; */

            /* Dummy fitness */
            _evalCount++;
            double fitness = 0.5;

            if (_evalCount > _nextEvalStop)
            {
                _nextEvalStop += _evalBlockSize;
                _stopConditionSatisfied = true;
            }

            //double fitness = 0.0;
            //For the first set of evaluations, try to establish a number of hidden node. 
            // This initializes the network to a certain complexity
            //FastAcyclicNetwork concrete = (FastAcyclicNetwork)box;
            // Searching for a ideally 2 hidden nodes
            //fitness = 100 - Math.Abs(2 - concrete.hiddenNodeCount);

            FitnessInfo fitnessInfo = new FitnessInfo(fitness, fitness); // Second arguement is auxilary fitness, probably wont need to use it
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
