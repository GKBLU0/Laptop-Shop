"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function RepairTab() {
  const [laptopId, setLaptopId] = useState("")
  const [issueDescription, setIssueDescription] = useState("")

  const handleSubmit = () => {
    // Implement repair request submission logic here
    alert(`Repair request submitted for Laptop ID: ${laptopId} - Issue: ${issueDescription}`)
    setLaptopId("")
    setIssueDescription("")
  }

  return (
    <div className="space-y-4">
      <h2>Submit Repair Request</h2>
      <div className="space-y-2">
        <Label htmlFor="laptopId">Laptop ID</Label>
        <Input
          id="laptopId"
          type="number"
          value={laptopId}
          onChange={(e) => setLaptopId(e.target.value)}
          placeholder="Enter Laptop ID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issueDescription">Issue Description</Label>
        <Textarea
          id="issueDescription"
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Describe the issue"
        />
      </div>
      <Button onClick={handleSubmit}>Submit Request</Button>
    </div>
  )
}
