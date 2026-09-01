import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface TeamMember {
  name: string;
  age: number;
  department: string;
  available: boolean;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  // Team members
  teamMembers: TeamMember[] = [
    {
      name: 'Youanas',
      age: 28,
      department: 'Development',
      available: true
    },
    {
      name: 'Ahmed',
      age: 24,
      department: 'Marketing',
      available: false
    },
    {
      name: 'Omar',
      age: 26,
      department: 'Design',
      available: true
    }
  ];

  // Departments
  departments: string[] = [
    'Development',
    'Marketing',
    'Design'
  ];

  // Selected department for filtering
  selectedDepartment: string = 'All';

  // Current display mode
  viewMode: 'card' | 'list' = 'card';

  // Form data
  newMember = {
    name: '',
    age: null as number | null,
    department: '',
    available: false
  };

  // Add new member
  addMember(): void {

    if (
      !this.newMember.name.trim() ||
      this.newMember.age === null ||
      this.newMember.age <= 0 ||
      !this.newMember.department
    ) {
      return;
    }

    const member: TeamMember = {
      name: this.newMember.name.trim(),
      age: this.newMember.age,
      department: this.newMember.department,
      available: this.newMember.available
    };

    this.teamMembers.push(member);

    // Clear form
    this.newMember = {
      name: '',
      age: null,
      department: '',
      available: false
    };
  }

  // Toggle member availability
  toggleAvailability(member: TeamMember): void {
    member.available = !member.available;
  }

  // Get filtered members
  get filteredMembers(): TeamMember[] {
    if (this.selectedDepartment === 'All') {
      return this.teamMembers;
    }

    return this.teamMembers.filter(
      member => member.department === this.selectedDepartment
    );
  }
}

