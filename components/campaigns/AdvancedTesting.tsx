"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shuffle, 
  Brain, 
  Zap, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Info,
  Settings,
  Plus,
  Trash2,
  Eye,
  MousePointer,
  Users
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterPlot,
  Scatter,
  Cell
} from 'recharts';

interface AdvancedTestingProps {
  testType: 'multivariate' | 'sequential' | 'bayesian';
  onConfigurationChange?: (config: any) => void;
}

interface MultivariateElement {
  id: string;
  name: string;
  type: 'subject' | 'content' | 'cta' | 'image' | 'send_time';
  variants: string[];
}

interface SequentialTestConfig {
  enabled: boolean;
  lookAheadHorizon: number;
  interimAnalysisFrequency: number;
  alphaSpending: 'obrien_fleming' | 'pocock' | 'haybittle_peto';
  efficacyBoundary: number;
  futilityBoundary: number;
}

interface BayesianConfig {
  enabled: boolean;
  priorDistribution: 'beta' | 'normal' | 'gamma';
  priorParameters: {
    alpha: number;
    beta: number;
    mean?: number;
    variance?: number;
  };
  posteriorSimulations: number;
  credibleInterval: number;
  decisionThreshold: number;
  explorationStrategy: 'thompson_sampling' | 'ucb' | 'epsilon_greedy';
}

const AdvancedTesting: React.FC<AdvancedTestingProps> = ({ testType, onConfigurationChange }) => {
  const [multivariateElements, setMultivariateElements] = useState<MultivariateElement[]>([
    {
      id: 'subject',
      name: 'Subject Line',
      type: 'subject',
      variants: ['Original Subject', 'Variant A Subject']
    }
  ]);

  const [sequentialConfig, setSequentialConfig] = useState<SequentialTestConfig>({
    enabled: false,
    lookAheadHorizon: 14,
    interimAnalysisFrequency: 24, // hours
    alphaSpending: 'obrien_fleming',
    efficacyBoundary: 0.05,
    futilityBoundary: 0.8
  });

  const [bayesianConfig, setBayesianConfig] = useState<BayesianConfig>({
    enabled: false,
    priorDistribution: 'beta',
    priorParameters: {
      alpha: 1,
      beta: 1
    },
    posteriorSimulations: 10000,
    credibleInterval: 95,
    decisionThreshold: 0.9,
    explorationStrategy: 'thompson_sampling'
  });

  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate total combinations for multivariate test
  const totalCombinations = multivariateElements.reduce((total, element) => {
    return total * Math.max(1, element.variants.length);
  }, 1);

  const addMultivariateElement = () => {
    const newElement: MultivariateElement = {
      id: `element-${Date.now()}`,
      name: 'New Element',
      type: 'content',
      variants: ['Original', 'Variant A']
    };
    setMultivariateElements([...multivariateElements, newElement]);
  };

  const updateMultivariateElement = (id: string, updates: Partial<MultivariateElement>) => {
    setMultivariateElements(prev => 
      prev.map(element => element.id === id ? { ...element, ...updates } : element)
    );
  };

  const removeMultivariateElement = (id: string) => {
    if (multivariateElements.length > 1) {
      setMultivariateElements(prev => prev.filter(element => element.id !== id));
    }
  };

  const addVariantToElement = (elementId: string) => {
    const element = multivariateElements.find(e => e.id === elementId);
    if (element) {
      const newVariantName = `Variant ${String.fromCharCode(65 + element.variants.length - 1)}`;
      updateMultivariateElement(elementId, {
        variants: [...element.variants, newVariantName]
      });
    }
  };

  const removeVariantFromElement = (elementId: string, variantIndex: number) => {
    const element = multivariateElements.find(e => e.id === elementId);
    if (element && element.variants.length > 2) {
      updateMultivariateElement(elementId, {
        variants: element.variants.filter((_, index) => index !== variantIndex)
      });
    }
  };

  const simulateSequentialTest = async () => {
    setIsSimulating(true);
    
    // Simulate sequential test progression
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const simulationData = [];
    for (let day = 1; day <= sequentialConfig.lookAheadHorizon; day++) {
      const sampleSize = day * 50;
      const alpha = calculateSequentialBoundary(day, sequentialConfig.alphaSpending);
      const power = Math.min(0.9, (sampleSize / 1000) * 0.8 + 0.1);
      
      simulationData.push({
        day,
        sampleSize,
        alpha,
        power,
        efficacyBoundary: alpha,
        futilityBoundary: sequentialConfig.futilityBoundary
      });
    }
    
    setSimulationResults({
      type: 'sequential',
      data: simulationData,
      expectedDuration: Math.floor(sequentialConfig.lookAheadHorizon * 0.7),
      probabilityOfSuccess: 0.85
    });
    
    setIsSimulating(false);
  };

  const simulateBayesianTest = async () => {
    setIsSimulating(true);
    
    // Simulate Bayesian test progression
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const simulationData = [];
    for (let iteration = 1; iteration <= 20; iteration++) {
      const posterior = {
        mean: 0.15 + (iteration * 0.002),
        variance: 0.01 / iteration,
        credibleLower: 0.10 + (iteration * 0.001),
        credibleUpper: 0.20 + (iteration * 0.003)
      };
      
      simulationData.push({
        iteration,
        posteriorMean: posterior.mean,
        credibleLower: posterior.credibleLower,
        credibleUpper: posterior.credibleUpper,
        probabilityOfSuccess: Math.min(0.95, 0.5 + (iteration * 0.02))
      });
    }
    
    setSimulationResults({
      type: 'bayesian',
      data: simulationData,
      expectedDuration: 12,
      probabilityOfSuccess: 0.89,
      expectedLoss: 0.02
    });
    
    setIsSimulating(false);
  };

  function calculateSequentialBoundary(time: number, method: string): number {
    switch (method) {
      case 'obrien_fleming':
        return 0.05 / Math.sqrt(time);
      case 'pocock':
        return 0.05 / time;
      case 'haybittle_peto':
        return time < 10 ? 0.001 : 0.05;
      default:
        return 0.05;
    }
  }

  if (testType === 'multivariate') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Multivariate Test Configuration
            </CardTitle>
            <CardDescription>
              Test multiple elements simultaneously to find optimal combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Elements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Test Elements</h4>
                <Badge variant="outline">
                  {totalCombinations} total combinations
                </Badge>
              </div>

              {totalCombinations > 16 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {totalCombinations} combinations may require a very large sample size. 
                    Consider reducing the number of variants per element.
                  </AlertDescription>
                </Alert>
              )}

              {multivariateElements.map((element, elementIndex) => (
                <Card key={element.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Input
                          value={element.name}
                          onChange={(e) => updateMultivariateElement(element.id, { name: e.target.value })}
                          className="font-medium border-none p-0 h-auto"
                        />
                        <Badge variant="outline">
                          {element.variants.length} variants
                        </Badge>
                      </div>
                      {multivariateElements.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMultivariateElement(element.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {element.variants.map((variant, variantIndex) => (
                      <div key={variantIndex} className="flex items-center gap-2">
                        <Input
                          value={variant}
                          onChange={(e) => {
                            const newVariants = [...element.variants];
                            newVariants[variantIndex] = e.target.value;
                            updateMultivariateElement(element.id, { variants: newVariants });
                          }}
                          placeholder={`Variant ${variantIndex === 0 ? 'Original' : String.fromCharCode(65 + variantIndex - 1)}`}
                        />
                        {element.variants.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariantFromElement(element.id, variantIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVariantToElement(element.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addMultivariateElement} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Test Element
              </Button>
            </div>

            {/* Sample Size Calculator */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Sample Size Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Combinations:</span>
                    <div className="font-bold text-blue-900">{totalCombinations}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Min per combination:</span>
                    <div className="font-bold text-blue-900">100</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Total required:</span>
                    <div className="font-bold text-blue-900">{(totalCombinations * 100).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Est. duration:</span>
                    <div className="font-bold text-blue-900">{Math.ceil(totalCombinations / 2)} days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testType === 'sequential') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sequential Testing Configuration
            </CardTitle>
            <CardDescription>
              Stop tests early when statistical significance is reached
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sequential-enabled">Enable Sequential Testing</Label>
                <p className="text-sm text-gray-600">
                  Allow tests to stop early based on statistical boundaries
                </p>
              </div>
              <Switch
                id="sequential-enabled"
                checked={sequentialConfig.enabled}
                onCheckedChange={(checked) => 
                  setSequentialConfig(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {sequentialConfig.enabled && (
              <div className="space-y-6 border-l-4 border-blue-200 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Look-ahead Horizon (days)</Label>
                    <Input
                      type="number"
                      min="7"
                      max="90"
                      value={sequentialConfig.lookAheadHorizon}
                      onChange={(e) => setSequentialConfig(prev => ({
                        ...prev,
                        lookAheadHorizon: parseInt(e.target.value) || 14
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Interim Analysis Frequency (hours)</Label>
                    <Input
                      type="number"
                      min="6"
                      max="168"
                      value={sequentialConfig.interimAnalysisFrequency}
                      onChange={(e) => setSequentialConfig(prev => ({
                        ...prev,
                        interimAnalysisFrequency: parseInt(e.target.value) || 24
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Alpha Spending Function</Label>
                  <select
                    value={sequentialConfig.alphaSpending}
                    onChange={(e) => setSequentialConfig(prev => ({
                      ...prev,
                      alphaSpending: e.target.value as any
                    }))}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="obrien_fleming">O'Brien-Fleming</option>
                    <option value="pocock">Pocock</option>
                    <option value="haybittle_peto">Haybittle-Peto</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Controls how Type I error is distributed across interim analyses
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Efficacy Boundary (α)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="0.1"
                      value={sequentialConfig.efficacyBoundary}
                      onChange={(e) => setSequentialConfig(prev => ({
                        ...prev,
                        efficacyBoundary: parseFloat(e.target.value) || 0.05
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Futility Boundary (β)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="0.9"
                      value={sequentialConfig.futilityBoundary}
                      onChange={(e) => setSequentialConfig(prev => ({
                        ...prev,
                        futilityBoundary: parseFloat(e.target.value) || 0.8
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={simulateSequentialTest}
                    disabled={isSimulating}
                    className="flex-1"
                  >
                    {isSimulating ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Simulate Sequential Test
                      </>
                    )}
                  </Button>
                </div>

                {simulationResults?.type === 'sequential' && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900">Simulation Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-green-700">Expected Duration:</span>
                          <div className="font-bold text-green-900">{simulationResults.expectedDuration} days</div>
                        </div>
                        <div>
                          <span className="text-green-700">Success Probability:</span>
                          <div className="font-bold text-green-900">{(simulationResults.probabilityOfSuccess * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={simulationResults.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="efficacyBoundary" stroke="#ef4444" name="Efficacy Boundary" />
                            <Line type="monotone" dataKey="futilityBoundary" stroke="#f59e0b" name="Futility Boundary" />
                            <Line type="monotone" dataKey="power" stroke="#10b981" name="Statistical Power" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testType === 'bayesian') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Bayesian Testing Configuration
            </CardTitle>
            <CardDescription>
              Use Bayesian statistics for more efficient and interpretable results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bayesian-enabled">Enable Bayesian Analysis</Label>
                <p className="text-sm text-gray-600">
                  Use Bayesian methods instead of traditional frequentist statistics
                </p>
              </div>
              <Switch
                id="bayesian-enabled"
                checked={bayesianConfig.enabled}
                onCheckedChange={(checked) => 
                  setBayesianConfig(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {bayesianConfig.enabled && (
              <div className="space-y-6 border-l-4 border-purple-200 pl-6">
                <div>
                  <Label>Prior Distribution</Label>
                  <select
                    value={bayesianConfig.priorDistribution}
                    onChange={(e) => setBayesianConfig(prev => ({
                      ...prev,
                      priorDistribution: e.target.value as any
                    }))}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="beta">Beta Distribution (for rates)</option>
                    <option value="normal">Normal Distribution</option>
                    <option value="gamma">Gamma Distribution</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Prior Alpha (α)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={bayesianConfig.priorParameters.alpha}
                      onChange={(e) => setBayesianConfig(prev => ({
                        ...prev,
                        priorParameters: {
                          ...prev.priorParameters,
                          alpha: parseFloat(e.target.value) || 1
                        }
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Prior Beta (β)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={bayesianConfig.priorParameters.beta}
                      onChange={(e) => setBayesianConfig(prev => ({
                        ...prev,
                        priorParameters: {
                          ...prev.priorParameters,
                          beta: parseFloat(e.target.value) || 1
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Posterior Simulations</Label>
                    <Input
                      type="number"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={bayesianConfig.posteriorSimulations}
                      onChange={(e) => setBayesianConfig(prev => ({
                        ...prev,
                        posteriorSimulations: parseInt(e.target.value) || 10000
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Credible Interval (%)</Label>
                    <Input
                      type="number"
                      min="80"
                      max="99"
                      value={bayesianConfig.credibleInterval}
                      onChange={(e) => setBayesianConfig(prev => ({
                        ...prev,
                        credibleInterval: parseInt(e.target.value) || 95
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Decision Threshold</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[bayesianConfig.decisionThreshold * 100]}
                      onValueChange={([value]) => setBayesianConfig(prev => ({
                        ...prev,
                        decisionThreshold: value / 100
                      }))}
                      min={50}
                      max={99}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {(bayesianConfig.decisionThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Probability threshold for declaring a winner
                  </p>
                </div>

                <div>
                  <Label>Exploration Strategy</Label>
                  <select
                    value={bayesianConfig.explorationStrategy}
                    onChange={(e) => setBayesianConfig(prev => ({
                      ...prev,
                      explorationStrategy: e.target.value as any
                    }))}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="thompson_sampling">Thompson Sampling</option>
                    <option value="ucb">Upper Confidence Bound</option>
                    <option value="epsilon_greedy">Epsilon-Greedy</option>
                  </select>
                </div>

                <Button 
                  onClick={simulateBayesianTest}
                  disabled={isSimulating}
                  className="w-full"
                >
                  {isSimulating ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Running Bayesian Simulation...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Simulate Bayesian Test
                    </>
                  )}
                </Button>

                {simulationResults?.type === 'bayesian' && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-900">Bayesian Simulation Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-purple-700">Expected Duration:</span>
                          <div className="font-bold text-purple-900">{simulationResults.expectedDuration} days</div>
                        </div>
                        <div>
                          <span className="text-purple-700">Success Probability:</span>
                          <div className="font-bold text-purple-900">{(simulationResults.probabilityOfSuccess * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-purple-700">Expected Loss:</span>
                          <div className="font-bold text-purple-900">{(simulationResults.expectedLoss * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={simulationResults.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="iteration" />
                            <YAxis />
                            <Tooltip />
                            <Area 
                              type="monotone" 
                              dataKey="credibleUpper" 
                              stroke="#8B5CF6" 
                              fill="#8B5CF6" 
                              fillOpacity={0.2}
                              name="Upper Bound"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="credibleLower" 
                              stroke="#8B5CF6" 
                              fill="#FFFFFF" 
                              fillOpacity={1}
                              name="Lower Bound"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="posteriorMean" 
                              stroke="#7C3AED" 
                              strokeWidth={2}
                              name="Posterior Mean"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AdvancedTesting;
