import React from 'react'
import { 
  Tag, 
  Button, 
  TextArea, 
  Intent, 
  Alignment, 
  Icon,
  Divider
} from "@blueprintjs/core";
import { TimePicker, TimePrecision } from '@blueprintjs/datetime';
import { FieldSelect, Field } from './Fields';
import { Condition, When, Else } from 'bloom-conditionals';
import { Validator, VALIDATE } from 'bloom-state-validator/lib';

const CompactTask = (props) => {
  const { task, ...rest } = props;

  return <Button fill minimal={!task._action?true:false} icon={task._action?'add':null} alignText={Alignment.LEFT} intent={task._action?Intent.PRIMARY:null} {...rest}>
    <div>{task.title}</div>
    { !task._action && (
      <div align="right">{task.project?task.project.title:''}&nbsp;&nbsp;&nbsp;&nbsp;<Icon icon="git-branch" /></div>
    )}
  </Button>
}

const buildTasksDropdown = (backend) => {
  return [{
    id: '-new-task-',
    title: 'New Task',
    _action: true,
    project: {}
  }].concat(Object.values(backend.tasks) || [])
    .sort((a, b) => {
    if ( a._action ) {
      return -1;
    } else if ( b._action ) {
      return 1;
    }

    return a.label > b.label;
  })
}

const  taskPredicate = (query, task) => {
  // don't filter out actions from list
  if (task.hasOwnProperty('_action')) {
    return true;
  }

  // combine values from project and task so we can search both
  let parts = Object.values(task).concat(Object.values(task.project || {}))
  parts = parts
    .filter(i => typeof i === 'string')
    .map(i => i.toString().toLowerCase())
    .join('.');

  return parts
    .indexOf(query.toLowerCase()) >= 0;
}

const renderTask = (task, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return <CompactTask key={task.id} onClick={handleClick} task={task} />
}

class EditTimeEntry extends React.PureComponent {

  constructor(props) {
    super(props);

    this.validator = new Validator(this, {
      name: { default: null },
      availableTasks: { default: [] },
      task: { default: props.backend.currentEntry },
      comment: { default: '' }
    });

    this.state = this.validator.generateState();
    this.validator.reset();
  }

  toggleTimer() {
    const { backend } = this.props;

    if ( this.state.task._action ) {
      if ( this.state.task.id == "-new-task-" ) {
        backend.actions.createTask({
          label: this.state.task_title,
          description: this.state.comment
        })
        .then(task => {
          backend.actions.startTimer(task);
        })
      }
    } else {
      if ( backend.currentEntry ) {
        backend.actions.startTimer(backend.currentEntry);
      }
    }
  }

  render() {
    const { backend } = this.props;
    
    const tasks = buildTasksDropdown(backend);
    const { task, comment } = this.validator.state;
    const onToggleTimer = () => this.toggleTimer()
    const onCancelClick = () => this.props.history.push('/timesheet')

    return (
      <div className="page entry">
        <div align="center">
          <Tag large intent={Intent.NONE} >{backend.currentDate.format('dddd, LL')}</Tag>
        </div>
        <FieldSelect
          fill
          label="Task"
          id="tasks_select"
          items={tasks}
          itemRenderer={renderTask}
          itemPredicate={taskPredicate}
          onItemSelect={task.setter()}
        >
          <Condition test={task.value}>
            <When hasValue>
              <CompactTask large task={task.value} rightIcon="double-caret-vertical" minimal={false} />
            </When>
            <Else>
              <Button 
                fill
                large
                text=" - Select Task - "
                alignText={Alignment.LEFT}
                rightIcon="double-caret-vertical" />
            </Else>
          </Condition>
        </FieldSelect>

        <div className="row">
          <div className="col-4 vertical-center">
            <Button fill large icon="delete" text="Cancel" intent={Intent.DANGER} onClick={onCancelClick} />
          </div>
          <div align="center" className="col-4">
            <TimePicker 
              precision={ TimePrecision.MINUTE }
              showArrowButtons
              />
          </div>
          <div className="col-4 vertical-center">
            <Button fill large icon="play" text="Start" intent={Intent.PRIMARY} onClick={onToggleTimer} />
          </div>
        </div>

        <Divider />

        <Field id="comment" label="Comment">
          <TextArea id="comment" fill large {...comment.toInputProps()} />
        </Field>

      </div>
    );
  }

}

export default EditTimeEntry;
