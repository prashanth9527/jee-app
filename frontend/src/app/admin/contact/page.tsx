'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';

interface ContactTicket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'TECHNICAL_SUPPORT' | 'BILLING' | 'FEEDBACK' | 'PARTNERSHIP' | 'OTHER';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  responses: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
    responder: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
}

export default function AdminContactPage() {
  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ContactTicket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/contact/tickets', { params: filters });
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/contact/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, priority?: string) => {
    try {
      await api.put(`/contact/tickets/${ticketId}/status`, { status, priority });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: status as any, priority: priority as any });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const addResponse = async (ticketId: string) => {
    if (!responseMessage.trim()) return;

    try {
      await api.post(`/contact/tickets/${ticketId}/responses`, {
        message: responseMessage,
        isInternal
      });
      setResponseMessage('');
      setIsInternal(false);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error adding response:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'WAITING_FOR_USER': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicHead 
        title="Contact Tickets - Admin"
        description="Manage contact tickets and support requests"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contact Tickets</h1>
            <p className="mt-2 text-gray-600">Manage and respond to customer support tickets</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tickets</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{stats.byStatus.open}</div>
                <div className="text-sm text-gray-600">Open</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tickets List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-6 hover:bg-gray-50 cursor-pointer ${
                        selectedTicket?.id === ticket.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {ticket.category.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">{ticket.name} ({ticket.email})</p>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{ticket.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          {ticket.responses.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-1">
              {selectedTicket ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Ticket Info */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">From:</span> {selectedTicket.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedTicket.email}</p>
                        {selectedTicket.phone && (
                          <p><span className="font-medium">Phone:</span> {selectedTicket.phone}</p>
                        )}
                        <p><span className="font-medium">Category:</span> {selectedTicket.category.replace('_', ' ')}</p>
                        <p><span className="font-medium">Created:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedTicket.message}</p>
                    </div>

                    {/* Status Controls */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                      <div className="space-y-2">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_FOR_USER">Waiting for User</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) => updateTicketStatus(selectedTicket.id, selectedTicket.status, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Responses */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Responses</h4>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {selectedTicket.responses.map((response) => (
                          <div key={response.id} className={`p-3 rounded text-sm ${
                            response.isInternal ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-blue-50 border-l-4 border-blue-400'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-900">
                                {response.responder.fullName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {response.isInternal && (
                              <span className="text-xs text-yellow-600 font-medium">Internal Note</span>
                            )}
                            <p className="text-gray-700 mt-1">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Response */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Add Response</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isInternal"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor="isInternal" className="text-sm text-gray-600">
                            Internal note (not visible to user)
                          </label>
                        </div>
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Type your response..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                        />
                        <button
                          onClick={() => addResponse(selectedTicket.id)}
                          disabled={!responseMessage.trim()}
                          className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">Select a ticket to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
