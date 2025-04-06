interface Category {
  id: string
  title: string
  questions: Question[]
}

interface Question {
  id: string
  title: string
  content: string
}

class MockDataService {
  private categories: Category[] = [
    {
      id: '1',
      title: 'Account',
      questions: [
        {
          id: '1',
          title: 'How do I change my password?',
          content: 'To change your password, go to Settings > Account > Password and follow the instructions.'
        },
        {
          id: '2',
          title: 'How do I update my profile?',
          content: 'To update your profile, go to Settings > Profile and make your changes.'
        }
      ]
    },
    {
      id: '2',
      title: 'Payments',
      questions: [
        {
          id: '3',
          title: 'How do I add a payment method?',
          content: 'To add a payment method, go to Settings > Payments > Add Payment Method.'
        },
        {
          id: '4',
          title: 'What payment methods are accepted?',
          content: 'We accept credit cards, debit cards, and PayPal.'
        }
      ]
    }
  ]

  async getCategories(): Promise<Category[]> {
    return Promise.resolve(this.categories)
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return Promise.resolve(this.categories.find(category => category.id === id))
  }

  async getQuestion(categoryId: string, questionId: string): Promise<Question | undefined> {
    const category = await this.getCategory(categoryId)
    return Promise.resolve(category?.questions.find(question => question.id === questionId))
  }

  async searchQuestions(query: string): Promise<Question[]> {
    const allQuestions = this.categories.flatMap(category => category.questions)
    const filteredQuestions = allQuestions.filter(question =>
      question.title.toLowerCase().includes(query.toLowerCase()) ||
      question.content.toLowerCase().includes(query.toLowerCase())
    )
    return Promise.resolve(filteredQuestions)
  }
}

export const mockDataService = new MockDataService() 