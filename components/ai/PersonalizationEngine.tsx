"use client";

import { useState, useEffect } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Brain,
  Sparkles,
  Mail,
  Users,
  CheckCircle,
  Info,
} from 'lucide-react';

interface PersonalizationEngineProps {
  templateId?: Id<'templates'>;
  contactIds?: Id<'contacts'>[];
  onPersonalizationUpdate?: (data: any) => void;
}

export function PersonalizationEngine({
  templateId,
  contactIds,
  onPersonalizationUpdate,
}: PersonalizationEngineProps) {
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const contacts = useQuery(api.contacts.getContactsByUser);
  
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleGeneratePersonalized = async () => {
    if (!contacts || contacts.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Simple demo content generation
      const firstContact = contacts[0];
      
      setPersonalizedContent({
        content: `Hi ${firstContact.firstName || 'there'},\n\nThis is personalized content for you based on your ${selectedSegment} profile. We've customized this message to match your interests and engagement level.\n\nBest regards,\nYour Team`,
        subjectLines: [
          `Hi ${firstContact.firstName || 'there'}, your personalized update`,
          `${firstContact.firstName || 'Valued customer'}, special content for you`,
          `Personalized recommendations for ${firstContact.firstName || 'you'}`
        ]
      });
      
      if (onPersonalizationUpdate) {
        onPersonalizationUpdate(personalizedContent);
      }
    } catch (error) {
      console.error('Error generating personalized content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetRecommendations = async () => {
    // Simple static recommendations for demo
    setRecommendations([
      {
        title: "Add personalization tags",
        description: "Use {{firstName}} to make emails more personal",
        impact: "High"
      },
      {
        title: "Segment your audience", 
        description: "Send different content to active vs inactive users",
        impact: "Medium"
      },
      {
        title: "Test subject lines",
        description: "Try A/B testing different subject line styles",
        impact: "High"
      }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Email Insights</h2>
          <p className="text-muted-foreground">
            Simple AI-powered recommendations for better emails
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{contacts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">Ready</p>
                <p className="text-sm text-muted-foreground">AI Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">Smart</p>
                <p className="text-sm text-muted-foreground">Personalization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Generate Personalized Content
          </CardTitle>
          <CardDescription>
            Create personalized email content for your audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="welcome">New Subscribers</SelectItem>
                <SelectItem value="promotional">Engaged Users</SelectItem>
                <SelectItem value="re-engagement">Inactive Users</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleGeneratePersonalized} 
              disabled={isAnalyzing || !contacts || contacts.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {(!contacts || contacts.length === 0) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add some contacts first to generate personalized content
              </AlertDescription>
            </Alert>
          )}

          {personalizedContent && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">✨ AI Generated Content</Label>
                {personalizedContent.subjectLines && personalizedContent.subjectLines.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Subject Lines:</p>
                    {personalizedContent.subjectLines.map((subject: string, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg mb-2">
                        <p className="text-sm">{subject}</p>
                      </div>
                    ))}
                  </div>
                )}

                {personalizedContent.content && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Personalized Content:</p>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{personalizedContent.content}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Simple tips to improve your email performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGetRecommendations} 
            className="mb-4"
            variant="outline"
          >
            <Brain className="h-4 w-4 mr-2" />
            Get AI Tips
          </Button>

          {recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      {rec.impact && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          {rec.impact} impact
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Get AI Tips" to see personalized recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Personalization Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personalization Tags
          </CardTitle>
          <CardDescription>
            Add these tags to your emails for automatic personalization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tag: '{{firstName}}', desc: 'First name' },
              { tag: '{{lastName}}', desc: 'Last name' },
              { tag: '{{company}}', desc: 'Company name' },
              { tag: '{{email}}', desc: 'Email address' }
            ].map((item) => (
              <div 
                key={item.tag}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigator.clipboard.writeText(item.tag)}
              >
                <code className="text-sm font-mono text-blue-600">{item.tag}</code>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click any tag to copy it. Paste these in your email templates for automatic personalization.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
