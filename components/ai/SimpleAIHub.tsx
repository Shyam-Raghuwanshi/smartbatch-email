"use client";

import React, { useState } from 'react';
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  Sparkles,
  Mail,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Info
} from 'lucide-react';

export function SimpleAIHub() {
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // AI Actions
  const analyzeEmailWithAI = useAction(api.perplexityAI.analyzeEmailWithAI);

  // User data for context
  const templates = useQuery(api.templates.getTemplatesByUser);
  const contacts = useQuery(api.contacts.getContactsByUser);

  const handleAnalyzeEmail = async () => {
    if (!emailContent.trim()) {
      alert('Please enter some email content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeEmailWithAI({
        content: emailContent,
        subject: emailSubject,
        analysisType: 'optimization',
        context: {
          campaignType: 'general',
          targetAudience: 'subscribers'
        }
      });
      
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({
        success: false,
        error: 'Failed to analyze email. Please try again.',
        timestamp: Date.now()
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoContent = (type: 'good' | 'spam') => {
    if (type === 'good') {
      setEmailSubject("Welcome to our newsletter!");
      setEmailContent("Hi there!\n\nWelcome to our weekly newsletter. We're excited to share valuable content with you.\n\nThis week:\n• Industry insights and trends\n• Tips for improving your workflow\n• Customer success stories\n\nBest regards,\nThe Team");
    } else {
      setEmailSubject("URGENT!!! Act NOW or lose EVERYTHING!!!");
      setEmailContent("ATTENTION!!!\n\nYour account will be DELETED in 24 HOURS unless you ACT NOW!\n\nCLICK HERE IMMEDIATELY to save your account:\n>>> CLICK NOW <<<\n\nDon't wait! This offer expires at MIDNIGHT!\n\nFREE MONEY! GUARANTEED RESULTS! NO RISK!\n\nHurry before it's too late!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Easy email analysis and optimization with AI
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      {/* Main AI Email Analyzer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Email Analyzer
          </CardTitle>
          <CardDescription>
            Check your emails for spam issues and get improvement suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demo Content Buttons */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Try with Demo Content</h4>
            <p className="text-xs text-blue-700 mb-3">
              Test the AI analyzer with example emails
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => loadDemoContent('good')}
              >
                ✅ Good Email Example
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => loadDemoContent('spam')}
              >
                ⚠️ Spammy Email Example
              </Button>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Email Subject Line</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter your email subject line..."
              />
            </div>
            
            <div>
              <Label htmlFor="email-content">Email Content</Label>
              <Textarea
                id="email-content"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Enter your email content here..."
                rows={8}
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={handleAnalyzeEmail}
            disabled={isAnalyzing || !emailContent.trim()}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                AI is analyzing your email...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Email with AI
              </>
            )}
          </Button>

          {/* Analysis Results */}
          {analysisResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {analysisResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.success ? (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {analysisResult.response}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ✨ Analyzed at {new Date(analysisResult.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {analysisResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Simple Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Quick Email Tips
          </CardTitle>
          <CardDescription>
            Simple best practices for better emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">✅ Do This:</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Use personalization like &quot;Hi &#123;&#123;firstName&#125;&#125;&quot;</li>
                <li>• Write clear, descriptive subject lines</li>
                <li>• Include a clear call-to-action</li>
                <li>• Keep paragraphs short and readable</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">❌ Avoid This:</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• ALL CAPS text or excessive punctuation!!!</li>
                <li>• Words like "FREE", "URGENT", "ACT NOW"</li>
                <li>• Too many links or images</li>
                <li>• Misleading subject lines</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Personalization Tags
          </CardTitle>
          <CardDescription>
            Click to copy these tags for your emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tag: '{{firstName}}', desc: 'First name' },
              { tag: '{{lastName}}', desc: 'Last name' },
              { tag: '{{email}}', desc: 'Email address' },
              { tag: '{{company}}', desc: 'Company name' }
            ].map((item) => (
              <div 
                key={item.tag}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(item.tag);
                  alert(`Copied ${item.tag}!`);
                }}
              >
                <code className="text-sm font-mono text-blue-600">{item.tag}</code>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Add these tags to your emails and they'll automatically be replaced with real contact information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
